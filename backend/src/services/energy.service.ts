import { prisma } from '../config/prisma.js';
import { calculateBill, calculateCarbonEmissions, calculatePercentageChange, calculateBatteryBackup } from '../utils/calculations.js';
import { simulationService } from './simulation.service.js';

class EnergyService {
  /**
   * Retrieves comprehensive dashboard summary including KPIs, trends, flow, and insights
   */
  public async getDashboardData(userId: string) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterdayObj = new Date(now);
    yesterdayObj.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    // 1. Fetch user profile, tariff, solar, battery
    const [profile, tariff, solar, battery, appliances] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.electricityTariff.findFirst({ where: { userId, isActive: true } }),
      prisma.solarSystem.findUnique({ where: { userId } }),
      prisma.battery.findUnique({ where: { userId } }),
      prisma.appliance.findMany({ where: { userId } }),
    ]);

    const tariffObj = tariff || {
      type: 'SLAB',
      baseRatePerKwh: 6.5,
      fixedMonthlyCharge: 140,
      taxPercent: 9,
      slab1Limit: 100,
      slab1Rate: 4.75,
      slab2Limit: 300,
      slab2Rate: 6.5,
      slab3Rate: 8.25,
    };

    // 2. Fetch today's and yesterday's consumption
    const [todayConsumption, yesterdayConsumption] = await Promise.all([
      prisma.energyConsumption.findFirst({
        where: { userId, date: todayStr, hour: null },
      }),
      prisma.energyConsumption.findFirst({
        where: { userId, date: yesterdayStr, hour: null },
      }),
    ]);

    const todayKwh = todayConsumption?.totalKwh || 12.8;
    const yesterdayKwh = yesterdayConsumption?.totalKwh || 13.9;
    const todayTrend = calculatePercentageChange(todayKwh, yesterdayKwh);

    // 3. Fetch current month and last month totals
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    const lastMonthObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = lastMonthObj.toISOString().substring(0, 7);

    const [thisMonthRecords, lastMonthRecords] = await Promise.all([
      prisma.energyConsumption.findMany({
        where: {
          userId,
          date: { startsWith: currentMonthPrefix },
          hour: null,
        },
      }),
      prisma.energyConsumption.findMany({
        where: {
          userId,
          date: { startsWith: lastMonthPrefix },
          hour: null,
        },
      }),
    ]);

    const thisMonthKwh = Number(thisMonthRecords.reduce((sum, r) => sum + r.totalKwh, 0).toFixed(1)) || 214.5;
    const lastMonthKwh = Number(lastMonthRecords.reduce((sum, r) => sum + r.totalKwh, 0).toFixed(1)) || 284.0;
    const monthTrend = calculatePercentageChange(thisMonthKwh, (lastMonthKwh * (now.getDate() / 30)));

    // 4. Calculate estimated bills
    const thisMonthBill = calculateBill(thisMonthKwh, tariffObj);
    const lastMonthBill = calculateBill(lastMonthKwh, tariffObj);
    const billTrend = calculatePercentageChange(thisMonthBill.totalBill, lastMonthBill.totalBill * (now.getDate() / 30));

    // Projected Month-End Bill
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = Math.max(1, now.getDate());
    const projectedMonthKwh = Number(((thisMonthKwh / currentDay) * daysInMonth).toFixed(1));
    const projectedMonthBill = calculateBill(projectedMonthKwh, tariffObj);

    // 5. Carbon emissions
    const gridKwhToday = todayConsumption?.gridKwh || Number((todayKwh * 0.45).toFixed(1));
    const carbonToday = calculateCarbonEmissions(gridKwhToday);
    const gridKwhMonth = thisMonthRecords.reduce((sum, r) => sum + r.gridKwh, 0) || Number((thisMonthKwh * 0.48).toFixed(1));
    const carbonMonth = calculateCarbonEmissions(gridKwhMonth);

    // 6. Live telemetry reading
    const liveTelemetry = await simulationService.generateInstantTelemetry(userId);

    // 7. Appliance consumption breakdown
    const totalAppliancePower = appliances.reduce((sum, a) => sum + (a.powerRatingWatts * a.dailyAvgHours), 0);
    const applianceBreakdown = appliances.map((app) => {
      const dailyAppKwh = Number(((app.powerRatingWatts * app.dailyAvgHours) / 1000).toFixed(2));
      const percentage = totalAppliancePower > 0
        ? Number(((app.powerRatingWatts * app.dailyAvgHours / totalAppliancePower) * 100).toFixed(1))
        : 0;
      const estCost = Number((dailyAppKwh * 30 * (tariffObj.baseRatePerKwh || 6.5)).toFixed(0));

      return {
        id: app.id,
        name: app.name,
        category: app.category,
        powerRatingWatts: app.powerRatingWatts,
        isOn: app.isOn,
        room: app.room,
        dailyKwh: dailyAppKwh,
        percentage,
        estimatedMonthlyCost: estCost,
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // 8. Energy Flow Data
    const solarGenerationKw = liveTelemetry.solarGenerationKw;
    const homeLoadKw = liveTelemetry.activePowerKw;
    const batterySocPercent = battery?.currentChargePercent || liveTelemetry.batterySocPercent;
    const gridDrawKw = liveTelemetry.gridDrawKw;
    const gridExportKw = liveTelemetry.gridExportKw;
    const batteryBackupHours = calculateBatteryBackup(battery?.capacityKwh || 10, batterySocPercent, homeLoadKw);

    // 9. Smart Insights
    const solarCoveredPct = todayKwh > 0 && (todayConsumption?.solarKwh || 14.8) > 0
      ? Math.min(100, Number((((todayConsumption?.solarKwh || 14.8) / todayKwh) * 100).toFixed(0)))
      : 38;

    const topAppliance = applianceBreakdown[0];

    const smartInsights = [
      {
        id: 'ins-1',
        title: 'Solar Contribution Today',
        description: `Solar generation covered ${solarCoveredPct}% of your total energy demand today, offsetting ₹${(todayKwh * 0.4 * 6.5).toFixed(0)} from your grid bill.`,
        type: 'POSITIVE',
        metric: `${solarCoveredPct}%`,
      },
      {
        id: 'ins-2',
        title: 'Top Consumer Identified',
        description: `${topAppliance?.name || 'Air Conditioner'} accounts for ${topAppliance?.percentage || 38}% of your total daily household electricity usage.`,
        type: 'NEUTRAL',
        metric: `${topAppliance?.percentage || 38}%`,
      },
      {
        id: 'ins-3',
        title: 'Off-Peak Optimization Opportunity',
        description: '38% of your total energy was consumed during evening peak tariff hours (6:00 PM - 10:00 PM).',
        type: 'ALERT',
        metric: 'Peak Load',
      },
    ];

    return {
      user: {
        location: profile?.location || 'Bengaluru, India',
        userType: profile?.userType || 'HOME',
        currency: profile?.currency || 'INR',
        hasSolar: profile?.hasSolar ?? true,
        hasBattery: profile?.hasBattery ?? true,
      },
      kpis: {
        currentPower: {
          valueKw: liveTelemetry.activePowerKw,
          unit: 'kW',
          status: liveTelemetry.activePowerKw > 2.5 ? 'high' : 'normal',
        },
        todayEnergy: {
          valueKwh: todayKwh,
          unit: 'kWh',
          comparison: todayTrend.formatted,
          isIncrease: todayTrend.isIncrease,
          comparisonLabel: 'vs yesterday',
        },
        thisMonthEnergy: {
          valueKwh: thisMonthKwh,
          unit: 'kWh',
          comparison: monthTrend.formatted,
          isIncrease: monthTrend.isIncrease,
          comparisonLabel: 'vs last month same period',
        },
        estimatedBill: {
          value: thisMonthBill.totalBill,
          currency: profile?.currency || 'INR',
          projectedMonthEnd: projectedMonthBill.totalBill,
          comparison: billTrend.formatted,
          isIncrease: billTrend.isIncrease,
          comparisonLabel: 'projected pace',
        },
        carbonEmissions: {
          valueKg: carbonMonth.emissionsKg,
          todayKg: carbonToday.emissionsKg,
          treesEquivalent: carbonMonth.treesEquivalent,
          vehicleKmEquivalent: carbonMonth.vehicleKmEquivalent,
          unit: 'kg CO₂e',
        },
      },
      energyFlow: {
        solarGenerationKw,
        homeLoadKw,
        batterySocPercent,
        batteryPowerKw: liveTelemetry.batteryPowerKw,
        batteryState: battery?.state || 'CHARGING',
        batteryBackupHours,
        gridDrawKw,
        gridExportKw,
      },
      applianceBreakdown,
      smartInsights,
      tariff: tariffObj,
      simulation: {
        isLive: simulationService.isRunning(),
      },
    };
  }

  /**
   * Retrieves consumption time-series chart data for different timeframes (Today, 7D, 30D, 6M)
   */
  public async getConsumptionChartData(userId: string, timeframe: string = 'today', metric: string = 'kwh') {
    const now = new Date();
    const tariff = await prisma.electricityTariff.findFirst({ where: { userId, isActive: true } });
    const rate = tariff?.baseRatePerKwh || 6.5;

    if (timeframe === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      const hourlyRecords = await prisma.energyConsumption.findMany({
        where: { userId, date: todayStr, hour: { not: null } },
        orderBy: { hour: 'asc' },
      });

      const currentHour = now.getHours();

      return Array.from({ length: 24 }).map((_, h) => {
        const found = hourlyRecords.find((r) => r.hour === h);
        let kwh = found?.totalKwh || 0;
        let solar = found?.solarKwh || 0;
        let grid = found?.gridKwh || 0;

        // If not in DB yet for current hour, synthesize realistic profile
        if (!found && h <= currentHour) {
          kwh = h >= 18 && h <= 22 ? 1.45 : h >= 6 && h <= 9 ? 0.95 : 0.45;
          if (h >= 6 && h <= 18) {
            solar = Number((1.8 * Math.sin(((h - 6) / 12) * Math.PI)).toFixed(2));
          }
          grid = Math.max(0, kwh - solar);
        }

        const value = metric === 'cost' ? Number((kwh * (h >= 18 && h <= 22 ? 8.5 : rate)).toFixed(2)) : kwh;
        const solarValue = metric === 'cost' ? Number((solar * rate).toFixed(2)) : solar;
        const gridValue = metric === 'cost' ? Number((grid * (h >= 18 && h <= 22 ? 8.5 : rate)).toFixed(2)) : grid;

        return {
          label: `${String(h).padStart(2, '0')}:00`,
          time: `${String(h).padStart(2, '0')}:00`,
          kwh,
          cost: Number((kwh * rate).toFixed(2)),
          value,
          solarKwh: solar,
          solarValue,
          gridKwh: grid,
          gridValue,
          isPeak: h >= 18 && h <= 22,
        };
      });
    }

    if (timeframe === '7d') {
      const records = await prisma.energyConsumption.findMany({
        where: { userId, hour: null },
        orderBy: { date: 'desc' },
        take: 7,
      });

      return records.reverse().map((r) => {
        const d = new Date(r.date);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const value = metric === 'cost' ? r.cost : r.totalKwh;
        return {
          label: dayLabel,
          date: r.date,
          kwh: r.totalKwh,
          cost: r.cost,
          value,
          solarKwh: r.solarKwh,
          gridKwh: r.gridKwh,
          peakKwh: r.peakKwh,
          offPeakKwh: r.offPeakKwh,
          carbonKg: r.carbonKg,
        };
      });
    }

    if (timeframe === '30d') {
      const records = await prisma.energyConsumption.findMany({
        where: { userId, hour: null },
        orderBy: { date: 'desc' },
        take: 30,
      });

      return records.reverse().map((r) => {
        const d = new Date(r.date);
        const label = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
        const value = metric === 'cost' ? r.cost : r.totalKwh;
        return {
          label,
          date: r.date,
          kwh: r.totalKwh,
          cost: r.cost,
          value,
          solarKwh: r.solarKwh,
          gridKwh: r.gridKwh,
          carbonKg: r.carbonKg,
        };
      });
    }

    // 6 Months
    const allDays = await prisma.energyConsumption.findMany({
      where: { userId, hour: null },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthsMap: Record<string, { totalKwh: number; cost: number; solarKwh: number; gridKwh: number; count: number }> = {};
    allDays.forEach((r) => {
      const monthKey = r.date.substring(0, 7); // YYYY-MM
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { totalKwh: 0, cost: 0, solarKwh: 0, gridKwh: 0, count: 0 };
      }
      monthsMap[monthKey].totalKwh += r.totalKwh;
      monthsMap[monthKey].cost += r.cost;
      monthsMap[monthKey].solarKwh += r.solarKwh;
      monthsMap[monthKey].gridKwh += r.gridKwh;
      monthsMap[monthKey].count += 1;
    });

    return Object.entries(monthsMap).slice(-6).map(([monthKey, data]) => {
      const [y, m] = monthKey.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const totalKwh = Number(data.totalKwh.toFixed(1));
      const cost = Number(data.cost.toFixed(0));
      return {
        label,
        month: monthKey,
        kwh: totalKwh,
        cost,
        value: metric === 'cost' ? cost : totalKwh,
        solarKwh: Number(data.solarKwh.toFixed(1)),
        gridKwh: Number(data.gridKwh.toFixed(1)),
      };
    });
  }
}

export const energyService = new EnergyService();
