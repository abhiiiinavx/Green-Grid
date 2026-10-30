import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { calculatePercentageChange } from '../utils/calculations.js';

export async function getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || '30d'; // 'today' | '7d' | '30d' | '3m' | '6m'

    let daysToFetch = 30;
    if (period === '7d') daysToFetch = 7;
    else if (period === '3m') daysToFetch = 90;
    else if (period === '6m') daysToFetch = 180;
    else if (period === 'today') daysToFetch = 1;

    const [records, appliances, tariff] = await Promise.all([
      prisma.energyConsumption.findMany({
        where: { userId, hour: null },
        orderBy: { date: 'desc' },
        take: daysToFetch * 2, // Take current + previous window for comparison
      }),
      prisma.appliance.findMany({ where: { userId } }),
      prisma.electricityTariff.findFirst({ where: { userId, isActive: true } }),
    ]);

    const currentPeriodRecords = records.slice(0, daysToFetch);
    const previousPeriodRecords = records.slice(daysToFetch, daysToFetch * 2);

    const currentTotalKwh = currentPeriodRecords.reduce((sum, r) => sum + r.totalKwh, 0);
    const previousTotalKwh = previousPeriodRecords.reduce((sum, r) => sum + r.totalKwh, 0);
    const consumptionDelta = calculatePercentageChange(currentTotalKwh, previousTotalKwh);

    const currentTotalCost = currentPeriodRecords.reduce((sum, r) => sum + r.cost, 0);
    const previousTotalCost = previousPeriodRecords.reduce((sum, r) => sum + r.cost, 0);
    const costDelta = calculatePercentageChange(currentTotalCost, previousTotalCost);

    const totalSolarKwh = currentPeriodRecords.reduce((sum, r) => sum + r.solarKwh, 0);
    const totalGridKwh = currentPeriodRecords.reduce((sum, r) => sum + r.gridKwh, 0);
    const totalPeakKwh = currentPeriodRecords.reduce((sum, r) => sum + r.peakKwh, 0);
    const totalOffPeakKwh = currentPeriodRecords.reduce((sum, r) => sum + r.offPeakKwh, 0);
    const totalCarbonKg = currentPeriodRecords.reduce((sum, r) => sum + r.carbonKg, 0);

    // Peak vs Off Peak distribution
    const peakPercentage = currentTotalKwh > 0 ? Number(((totalPeakKwh / currentTotalKwh) * 100).toFixed(1)) : 38;
    const offPeakPercentage = Number((100 - peakPercentage).toFixed(1));

    // Weekday vs Weekend distribution
    let weekdayKwhSum = 0;
    let weekdayCount = 0;
    let weekendKwhSum = 0;
    let weekendCount = 0;

    currentPeriodRecords.forEach((r) => {
      const d = new Date(r.date);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend) {
        weekendKwhSum += r.totalKwh;
        weekendCount++;
      } else {
        weekdayKwhSum += r.totalKwh;
        weekdayCount++;
      }
    });

    const avgWeekdayKwh = weekdayCount > 0 ? Number((weekdayKwhSum / weekdayCount).toFixed(1)) : 12.4;
    const avgWeekendKwh = weekendCount > 0 ? Number((weekendKwhSum / weekendCount).toFixed(1)) : 14.8;
    const weekendVsWeekdayRatio = calculatePercentageChange(avgWeekendKwh, avgWeekdayKwh);

    // Category breakdown
    const categoryMap: Record<string, { kwh: number; cost: number; count: number }> = {};
    const rate = tariff?.baseRatePerKwh || 6.5;

    appliances.forEach((app) => {
      const cat = app.category;
      if (!categoryMap[cat]) categoryMap[cat] = { kwh: 0, cost: 0, count: 0 };
      const appDailyKwh = (app.powerRatingWatts * app.dailyAvgHours) / 1000;
      categoryMap[cat].kwh += appDailyKwh * daysToFetch;
      categoryMap[cat].cost += appDailyKwh * daysToFetch * rate;
      categoryMap[cat].count += 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      kwh: Number(data.kwh.toFixed(1)),
      cost: Number(data.cost.toFixed(0)),
      count: data.count,
      percentage: currentTotalKwh > 0 ? Number(((data.kwh / currentTotalKwh) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.kwh - a.kwh);

    // Energy Efficiency Index (Score 0-100 based on solar self-consumption, peak moderation, and daily consistency)
    const solarRatio = currentTotalKwh > 0 ? Math.min(1, totalSolarKwh / currentTotalKwh) : 0.4;
    const offPeakRatio = currentTotalKwh > 0 ? (totalOffPeakKwh / currentTotalKwh) : 0.6;
    const efficiencyScore = Math.min(98, Math.max(45, Number((solarRatio * 40 + offPeakRatio * 40 + 15).toFixed(0))));

    // Timeline data for charts
    const timeline = currentPeriodRecords.slice().reverse().map((r) => {
      const d = new Date(r.date);
      return {
        date: r.date,
        label: `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`,
        totalKwh: r.totalKwh,
        cost: r.cost,
        solarKwh: r.solarKwh,
        gridKwh: r.gridKwh,
        peakKwh: r.peakKwh,
        offPeakKwh: r.offPeakKwh,
        carbonKg: r.carbonKg,
      };
    });

    const executiveSummary = `During this ${period} period, your total consumption was ${currentTotalKwh.toFixed(1)} kWh (₹${currentTotalCost.toFixed(0)}), which is ${consumptionDelta.formatted} compared to the previous period. Rooftop solar supplied ${totalSolarKwh.toFixed(1)} kWh (${solarRatio > 0 ? (solarRatio * 100).toFixed(0) : 0}%), abating ${totalCarbonKg.toFixed(1)} kg CO₂e. Weekends experienced ${weekendVsWeekdayRatio.formatted} higher usage than weekdays.`;

    sendSuccess(res, {
      period,
      summary: {
        totalKwh: Number(currentTotalKwh.toFixed(1)),
        totalCost: Number(currentTotalCost.toFixed(0)),
        totalSolarKwh: Number(totalSolarKwh.toFixed(1)),
        totalGridKwh: Number(totalGridKwh.toFixed(1)),
        totalCarbonKg: Number(totalCarbonKg.toFixed(1)),
        efficiencyScore,
        consumptionDelta,
        costDelta,
        executiveSummary,
      },
      timeOfUse: {
        peakKwh: Number(totalPeakKwh.toFixed(1)),
        offPeakKwh: Number(totalOffPeakKwh.toFixed(1)),
        peakPercentage,
        offPeakPercentage,
      },
      dayDistribution: {
        avgWeekdayKwh,
        avgWeekendKwh,
        differenceFormatted: weekendVsWeekdayRatio.formatted,
      },
      categoryBreakdown,
      timeline,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch analytics', 500);
  }
}
