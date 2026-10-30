import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { calculateBill } from '../utils/calculations.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getBillingOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const currentMonthPrefix = now.toISOString().substring(0, 7);

    const [tariff, monthRecords, userProfile, previousMonths] = await Promise.all([
      prisma.electricityTariff.findFirst({ where: { userId, isActive: true } }),
      prisma.energyConsumption.findMany({
        where: { userId, date: { startsWith: currentMonthPrefix }, hour: null },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.energyConsumption.findMany({
        where: { userId, hour: null },
        orderBy: { date: 'asc' },
      }),
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

    // Current month consumption
    const totalMonthKwh = Number(monthRecords.reduce((sum, r) => sum + r.totalKwh, 0).toFixed(1)) || 214.5;
    const currentBill = calculateBill(totalMonthKwh, tariffObj);

    // Projected Month-End Bill
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = Math.max(1, now.getDate());
    const dailyAverageKwh = Number((totalMonthKwh / currentDay).toFixed(2));
    const projectedMonthKwh = Number((dailyAverageKwh * daysInMonth).toFixed(1));
    const projectedBill = calculateBill(projectedMonthKwh, tariffObj);

    // Potential savings simulation (e.g. 15% reduction)
    const optimizedKwh = Number((projectedMonthKwh * 0.85).toFixed(1));
    const optimizedBill = calculateBill(optimizedKwh, tariffObj);
    const potentialMonthlySavings = Number((projectedBill.totalBill - optimizedBill.totalBill).toFixed(0));

    // Historical monthly bills aggregation
    const monthlyHistoryMap: Record<string, number> = {};
    previousMonths.forEach((r) => {
      const monthKey = r.date.substring(0, 7);
      monthlyHistoryMap[monthKey] = (monthlyHistoryMap[monthKey] || 0) + r.totalKwh;
    });

    const historicalBills = Object.entries(monthlyHistoryMap).slice(-6).map(([monthKey, kwh]) => {
      const [y, m] = monthKey.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const b = calculateBill(kwh, tariffObj);
      return {
        monthKey,
        label,
        kwh: Number(kwh.toFixed(1)),
        totalBill: b.totalBill,
        energyCharges: b.energyCharges,
        taxAmount: b.taxAmount,
      };
    });

    sendSuccess(res, {
      tariff: tariffObj,
      currentUsage: {
        totalMonthKwh,
        dailyAverageKwh,
        currentBillAmount: currentBill.totalBill,
        energyCharges: currentBill.energyCharges,
        fixedCharges: currentBill.fixedCharges,
        taxAmount: currentBill.taxAmount,
        effectiveRatePerKwh: currentBill.effectiveRatePerKwh,
        slabBreakdown: currentBill.slabBreakdown,
      },
      projection: {
        projectedMonthKwh,
        projectedBillAmount: projectedBill.totalBill,
        daysRemaining: daysInMonth - currentDay,
        potentialMonthlySavings,
        budgetLimit: userProfile?.monthlyBudget || 3500,
        isOverBudget: projectedBill.totalBill > (userProfile?.monthlyBudget || 3500),
      },
      historicalBills,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch billing overview', 500);
  }
}

export async function simulateBill(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { kwhAdjustmentPercent = 0, hoursReducedPerDay = 0, tariffType } = req.body;

    const tariff = await prisma.electricityTariff.findFirst({ where: { userId, isActive: true } });
    const tariffObj = {
      ...tariff,
      type: tariffType || tariff?.type || 'SLAB',
      baseRatePerKwh: tariff?.baseRatePerKwh || 6.5,
      fixedMonthlyCharge: tariff?.fixedMonthlyCharge || 140,
      taxPercent: tariff?.taxPercent || 9,
      slab1Limit: tariff?.slab1Limit ?? 100,
      slab1Rate: tariff?.slab1Rate ?? 4.75,
      slab2Limit: tariff?.slab2Limit ?? 300,
      slab2Rate: tariff?.slab2Rate ?? 6.5,
      slab3Rate: tariff?.slab3Rate ?? 8.25,
    };

    const baseMonthlyKwh = 280;
    // Calculate adjusted kWh
    let adjustedKwh = baseMonthlyKwh * (1 + kwhAdjustmentPercent / 100);
    if (hoursReducedPerDay > 0) {
      adjustedKwh -= hoursReducedPerDay * 1.5 * 30; // Assuming ~1.5 kW high draw appliance
    }
    adjustedKwh = Math.max(20, Number(adjustedKwh.toFixed(1)));

    const baselineBill = calculateBill(baseMonthlyKwh, tariffObj);
    const simulatedBill = calculateBill(adjustedKwh, tariffObj);
    const savings = Number((baselineBill.totalBill - simulatedBill.totalBill).toFixed(2));

    sendSuccess(res, {
      baselineKwh: baseMonthlyKwh,
      simulatedKwh: adjustedKwh,
      baselineBill: baselineBill.totalBill,
      simulatedBill: simulatedBill.totalBill,
      savings,
      breakdown: simulatedBill.slabBreakdown,
    });
  } catch (error: any) {
    sendError(res, 'Failed to simulate bill', 500);
  }
}

export async function updateTariff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const existing = await prisma.electricityTariff.findFirst({ where: { userId, isActive: true } });

    if (existing) {
      const updated = await prisma.electricityTariff.update({
        where: { id: existing.id },
        data: req.body,
      });
      sendSuccess(res, updated, 'Tariff configuration updated');
    } else {
      const created = await prisma.electricityTariff.create({
        data: { userId, ...req.body },
      });
      sendSuccess(res, created, 'Tariff created successfully', 201);
    }
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update tariff', 500);
  }
}
