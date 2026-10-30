import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getSolarDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hour = now.getHours();

    let [solar, todayConsumption, recentDays] = await Promise.all([
      prisma.solarSystem.findUnique({ where: { userId } }),
      prisma.energyConsumption.findFirst({ where: { userId, date: todayStr, hour: null } }),
      prisma.energyConsumption.findMany({
        where: { userId, hour: null },
        orderBy: { date: 'desc' },
        take: 7,
      }),
    ]);

    if (!solar) {
      solar = await prisma.solarSystem.create({
        data: {
          userId,
          capacityKw: 4.5,
          panelCount: 12,
          inverterModel: 'SunGrow Hybrid SG5.0RS',
          orientation: 'South-Facing',
          tiltAngle: 15.0,
          peakGenerationKw: 4.2,
          todayGenerationKwh: 14.8,
          lifetimeGenerationKwh: 1200.0,
          isActive: true,
        },
      });
    }

    // Live solar generation calculation
    let currentLiveKw = 0;
    if (hour >= 6 && hour <= 18) {
      const sunPos = Math.sin(((hour - 6) / 12) * Math.PI);
      currentLiveKw = Number((solar.capacityKw * 0.88 * Math.max(0, sunPos) + (Math.random() * 0.15 - 0.07)).toFixed(2));
      if (currentLiveKw < 0) currentLiveKw = 0;
    }

    const todayGenerationKwh = todayConsumption?.solarKwh || 16.4;
    const directSelfConsumptionKwh = Number((todayGenerationKwh * 0.68).toFixed(1));
    const gridExportKwh = Number((todayGenerationKwh - directSelfConsumptionKwh).toFixed(1));
    const totalConsumptionKwh = todayConsumption?.totalKwh || 12.8;
    const solarCoveragePercent = totalConsumptionKwh > 0
      ? Math.min(100, Number(((todayGenerationKwh / totalConsumptionKwh) * 100).toFixed(0)))
      : 0;

    // 7-day solar generation history
    const generationHistory = recentDays.reverse().map((r) => {
      const d = new Date(r.date);
      return {
        date: r.date,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        solarKwh: r.solarKwh,
        totalKwh: r.totalKwh,
        gridKwh: r.gridKwh,
      };
    });

    sendSuccess(res, {
      system: solar,
      live: {
        currentGenerationKw: currentLiveKw,
        peakCapacityKw: solar.capacityKw,
        capacityUtilizationPercent: Number(((currentLiveKw / solar.capacityKw) * 100).toFixed(1)),
        todayGenerationKwh,
        directSelfConsumptionKwh,
        gridExportKwh,
        solarCoveragePercent,
        estimatedTodaySavings: Number((todayGenerationKwh * 6.5).toFixed(0)),
      },
      generationHistory,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch solar details', 500);
  }
}

export async function updateSolarSystem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updated = await prisma.solarSystem.upsert({
      where: { userId },
      update: req.body,
      create: { userId, ...req.body },
    });
    sendSuccess(res, updated, 'Solar system configuration updated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update solar system', 500);
  }
}
