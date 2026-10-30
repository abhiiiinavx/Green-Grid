import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getGoalsAndBudgets(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const [goals, budget, profile, monthRecords] = await Promise.all([
      prisma.energyGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.energyBudget.findFirst({
        where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.energyConsumption.findMany({
        where: {
          userId,
          date: { startsWith: now.toISOString().substring(0, 7) },
          hour: null,
        },
      }),
    ]);

    const currentSpentKwh = monthRecords.reduce((sum, r) => sum + r.totalKwh, 0);
    const currentSpentCost = monthRecords.reduce((sum, r) => sum + r.cost, 0);

    const enrichedGoals = goals.map((g) => {
      let currentVal = g.currentValue;
      if (g.goalType === 'MONTHLY_KWH') currentVal = Number(currentSpentKwh.toFixed(1));
      if (g.goalType === 'MONTHLY_COST') currentVal = Number(currentSpentCost.toFixed(0));

      const percentage = g.targetValue > 0 ? Math.min(100, Number(((currentVal / g.targetValue) * 100).toFixed(1))) : 0;
      let pacingStatus = g.status;
      const daysPassed = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const expectedPacing = (daysPassed / daysInMonth) * g.targetValue;

      if (currentVal > g.targetValue) pacingStatus = 'BEHIND';
      else if (currentVal > expectedPacing * 1.1) pacingStatus = 'AT_RISK';
      else pacingStatus = 'ON_TRACK';

      return {
        ...g,
        currentValue: currentVal,
        percentage,
        status: pacingStatus,
      };
    });

    const activeBudget = budget || {
      budgetAmount: profile?.monthlyBudget || 3500,
      currentSpent: Number(currentSpentCost.toFixed(0)),
      projectedSpent: Number(((currentSpentCost / Math.max(1, now.getDate())) * 30).toFixed(0)),
      alertThresholdPercent: 85,
    };

    const budgetPercent = activeBudget.budgetAmount > 0
      ? Number(((activeBudget.currentSpent / activeBudget.budgetAmount) * 100).toFixed(1))
      : 0;

    sendSuccess(res, {
      goals: enrichedGoals,
      budget: {
        ...activeBudget,
        spentPercent: budgetPercent,
        isOverThreshold: budgetPercent >= activeBudget.alertThresholdPercent,
        remainingDays: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate(),
      },
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch goals and budgets', 500);
  }
}

export async function createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { title, goalType, targetValue, unit, endDate } = req.body;

    const goal = await prisma.energyGoal.create({
      data: {
        userId,
        title,
        goalType,
        targetValue,
        unit,
        startDate: new Date(),
        endDate: new Date(endDate),
        status: 'ON_TRACK',
      },
    });

    sendSuccess(res, goal, 'Goal created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create goal', 500);
  }
}

export async function updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const goal = await prisma.energyGoal.findFirst({ where: { id, userId } });
    if (!goal) {
      sendError(res, 'Goal not found', 404);
      return;
    }

    const updated = await prisma.energyGoal.update({
      where: { id },
      data: req.body,
    });

    sendSuccess(res, updated, 'Goal updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update goal', 500);
  }
}

export async function updateBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { budgetAmount, alertThresholdPercent } = req.body;
    const now = new Date();

    const budget = await prisma.energyBudget.upsert({
      where: {
        userId_month_year: {
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      update: {
        budgetAmount,
        alertThresholdPercent,
      },
      create: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        budgetAmount,
        alertThresholdPercent: alertThresholdPercent || 85,
      },
    });

    // Also update profile monthlyBudget
    await prisma.userProfile.update({
      where: { userId },
      data: { monthlyBudget: budgetAmount },
    });

    sendSuccess(res, budget, 'Monthly budget updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update budget', 500);
  }
}

export async function deleteGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const goal = await prisma.energyGoal.findFirst({ where: { id, userId } });
    if (!goal) {
      sendError(res, 'Goal not found', 404);
      return;
    }

    await prisma.energyGoal.delete({ where: { id } });
    sendSuccess(res, null, 'Energy goal deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete goal', 500);
  }
}

