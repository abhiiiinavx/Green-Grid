import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const recommendations = await prisma.energyRecommendation.findMany({
      where: { userId, isDismissed: false },
      include: {
        appliance: {
          select: { id: true, name: true, category: true, powerRatingWatts: true, isOn: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const highImpact = recommendations.filter((r) => r.impactLevel === 'HIGH');
    const mediumImpact = recommendations.filter((r) => r.impactLevel === 'MEDIUM');
    const quickWins = recommendations.filter((r) => r.impactLevel === 'QUICK_WIN');

    const totalPotentialSavingsKwh = recommendations.reduce((sum, r) => sum + r.potentialMonthlySavingsKwh, 0);
    const totalPotentialSavingsCost = recommendations.reduce((sum, r) => sum + r.potentialMonthlySavingsCost, 0);

    sendSuccess(res, {
      summary: {
        totalRecommendations: recommendations.length,
        totalPotentialSavingsKwh: Number(totalPotentialSavingsKwh.toFixed(1)),
        totalPotentialSavingsCost: Number(totalPotentialSavingsCost.toFixed(0)),
      },
      categorized: {
        highImpact,
        mediumImpact,
        quickWins,
      },
      all: recommendations,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch recommendations', 500);
  }
}

import { aiService } from '../services/ai.service.js';

export async function applyRecommendation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const recommendation = await prisma.energyRecommendation.findFirst({
      where: { id, userId },
      include: { appliance: true },
    });

    if (!recommendation) {
      sendError(res, 'Recommendation not found', 404);
      return;
    }

    // Apply real action if appliance is linked
    if (recommendation.applianceId && recommendation.appliance) {
      const app = recommendation.appliance;
      // If recommendation is to optimize AC schedule or reduce standby, adjust dailyAvgHours slightly down and schedule
      if (recommendation.title.toLowerCase().includes('standby') || recommendation.title.toLowerCase().includes('schedule')) {
        await prisma.appliance.update({
          where: { id: app.id },
          data: {
            dailyAvgHours: Math.max(1, Number((app.dailyAvgHours * 0.85).toFixed(1))),
            scheduleOff: app.scheduleOff || '23:00',
          },
        });
      }
    }

    const updated = await prisma.energyRecommendation.update({
      where: { id },
      data: { isApplied: true },
    });

    // Create a celebration notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Action Applied! 🎉',
        message: `Applied "${recommendation.title}". You will save up to ₹${recommendation.potentialMonthlySavingsCost}/month!`,
        type: 'RECOMMENDATION',
        link: '/recommendations',
      },
    });

    sendSuccess(res, updated, `Optimization applied: saving ~₹${recommendation.potentialMonthlySavingsCost}/month!`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to apply recommendation', 500);
  }
}

export async function dismissRecommendation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await prisma.energyRecommendation.updateMany({
      where: { id, userId },
      data: { isDismissed: true },
    });

    sendSuccess(res, null, 'Recommendation dismissed');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to dismiss recommendation', 500);
  }
}

export async function generateFreshRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const generated = await aiService.generateSmartRecommendations(userId);

    for (const rec of generated) {
      const existing = await prisma.energyRecommendation.findFirst({
        where: { userId, title: rec.title },
      });
      if (!existing) {
        await prisma.energyRecommendation.create({
          data: {
            userId,
            ...rec,
          },
        });
      }
    }

    const allRecs = await prisma.energyRecommendation.findMany({
      where: { userId, isDismissed: false },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, allRecs, 'Fresh AI recommendations generated based on live home usage!');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to generate recommendations', 500);
  }
}

