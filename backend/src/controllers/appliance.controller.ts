import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getAppliances(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const where: any = { userId };
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search };
    }

    const appliances = await prisma.appliance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { alerts: { where: { isRead: false } } },
        },
      },
    });

    const tariff = await prisma.electricityTariff.findFirst({ where: { userId, isActive: true } });
    const rate = tariff?.baseRatePerKwh || 6.5;

    const enriched = appliances.map((app) => {
      const dailyKwh = Number(((app.powerRatingWatts * app.dailyAvgHours) / 1000).toFixed(2));
      const monthlyKwh = Number((dailyKwh * 30).toFixed(1));
      const monthlyCost = Number((monthlyKwh * rate).toFixed(0));

      return {
        ...app,
        calculatedDailyKwh: dailyKwh,
        calculatedMonthlyKwh: monthlyKwh,
        calculatedMonthlyCost: monthlyCost,
        unreadAlertsCount: app._count.alerts,
      };
    });

    sendSuccess(res, enriched);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch appliances', 500);
  }
}

export async function getApplianceById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const appliance = await prisma.appliance.findFirst({
      where: { id, userId },
      include: {
        recommendations: { where: { isDismissed: false } },
        alerts: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!appliance) {
      sendError(res, 'Appliance not found', 404);
      return;
    }

    sendSuccess(res, appliance);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch appliance', 500);
  }
}

export async function createAppliance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const {
      name,
      category,
      powerRatingWatts,
      isSmart = true,
      isOn = false,
      priority = 'MEDIUM',
      room = 'Living Room',
      dailyAvgHours = 4,
      scheduleOn,
      scheduleOff,
    } = req.body;

    const tariff = await prisma.electricityTariff.findFirst({ where: { userId, isActive: true } });
    const rate = tariff?.baseRatePerKwh || 6.5;
    const todayKwh = Number(((powerRatingWatts * (isOn ? dailyAvgHours : 0)) / 1000).toFixed(2));
    const monthlyEstCost = Number(((powerRatingWatts * dailyAvgHours * 30 / 1000) * rate).toFixed(0));

    const appliance = await prisma.appliance.create({
      data: {
        userId,
        name,
        category,
        powerRatingWatts,
        isSmart,
        isOn,
        priority,
        room,
        dailyAvgHours,
        scheduleOn,
        scheduleOff,
        todayKwh,
        monthlyEstCost,
      },
    });

    sendSuccess(res, appliance, 'Appliance added successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create appliance', 500);
  }
}

export async function updateAppliance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.appliance.findFirst({ where: { id, userId } });
    if (!existing) {
      sendError(res, 'Appliance not found', 404);
      return;
    }

    const updated = await prisma.appliance.update({
      where: { id },
      data: req.body,
    });

    sendSuccess(res, updated, 'Appliance updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update appliance', 500);
  }
}

export async function toggleAppliance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { isOn } = req.body;

    const existing = await prisma.appliance.findFirst({ where: { id, userId } });
    if (!existing) {
      sendError(res, 'Appliance not found', 404);
      return;
    }

    const updated = await prisma.appliance.update({
      where: { id },
      data: { isOn: Boolean(isOn) },
    });

    sendSuccess(res, updated, `${updated.name} turned ${updated.isOn ? 'ON' : 'OFF'}`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to toggle appliance', 500);
  }
}

export async function deleteAppliance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.appliance.findFirst({ where: { id, userId } });
    if (!existing) {
      sendError(res, 'Appliance not found', 404);
      return;
    }

    await prisma.appliance.delete({ where: { id } });
    sendSuccess(res, null, 'Appliance deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete appliance', 500);
  }
}

export async function activatePresetScene(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { scene } = req.body;

    const appliances = await prisma.appliance.findMany({ where: { userId } });
    let updatedCount = 0;
    let description = '';

    if (scene === 'ECO_SAVER') {
      for (const app of appliances) {
        if (app.category === 'HEATING' || app.category === 'ELECTRONICS' || app.category === 'APPLIANCES') {
          if (app.isOn) {
            await prisma.appliance.update({ where: { id: app.id }, data: { isOn: false } });
            updatedCount++;
          }
        }
      }
      description = 'Eco Saver activated: Non-essential heating, extra laundry, and idle electronics turned off to conserve energy.';
    } else if (scene === 'GOOD_NIGHT') {
      for (const app of appliances) {
        const isMasterBedroom = app.room.toLowerCase().includes('master') || app.room.toLowerCase().includes('bedroom');
        const isFridge = app.name.toLowerCase().includes('refrigerator') || app.category === 'KITCHEN';
        const shouldBeOn = isMasterBedroom || isFridge;
        if (app.isOn !== shouldBeOn) {
          await prisma.appliance.update({ where: { id: app.id }, data: { isOn: shouldBeOn } });
          updatedCount++;
        }
      }
      description = 'Good Night mode active: Bedroom cooling maintained, living room and office devices powered down.';
    } else if (scene === 'PEAK_SHIELD') {
      for (const app of appliances) {
        if (app.powerRatingWatts >= 1000 && !app.name.toLowerCase().includes('refrigerator')) {
          if (app.isOn) {
            await prisma.appliance.update({ where: { id: app.id }, data: { isOn: false } });
            updatedCount++;
          }
        }
      }
      description = 'Peak Tariff Shield engaged: High-wattage loads paused to protect your bill from peak slab rates.';
    } else if (scene === 'AWAY_MODE') {
      for (const app of appliances) {
        const isFridge = app.name.toLowerCase().includes('refrigerator');
        if (app.isOn && !isFridge) {
          await prisma.appliance.update({ where: { id: app.id }, data: { isOn: false } });
          updatedCount++;
        }
      }
      description = 'Away mode enabled: Only the essential refrigerator remains active. Home is in deep conservation state.';
    } else if (scene === 'MOVIE_TIME') {
      for (const app of appliances) {
        if (app.room.toLowerCase().includes('living') || app.category === 'LIGHTING') {
          if (!app.isOn) {
            await prisma.appliance.update({ where: { id: app.id }, data: { isOn: true } });
            updatedCount++;
          }
        } else if (app.room.toLowerCase().includes('office') || app.room.toLowerCase().includes('study')) {
          if (app.isOn) {
            await prisma.appliance.update({ where: { id: app.id }, data: { isOn: false } });
            updatedCount++;
          }
        }
      }
      description = 'Movie Night setup: Living room climate & ambient lighting prepared for cozy entertainment.';
    } else if (scene === 'ALL_OFF') {
      for (const app of appliances) {
        if (!app.name.toLowerCase().includes('refrigerator') && app.isOn) {
          await prisma.appliance.update({ where: { id: app.id }, data: { isOn: false } });
          updatedCount++;
        }
      }
      description = 'All non-essential appliances switched off.';
    } else if (scene === 'ALL_ON') {
      for (const app of appliances) {
        if (!app.isOn) {
          await prisma.appliance.update({ where: { id: app.id }, data: { isOn: true } });
          updatedCount++;
        }
      }
      description = 'All configured appliances turned on.';
    }

    await prisma.notification.create({
      data: {
        userId,
        title: `Scene: ${scene.replace('_', ' ')}`,
        message: description,
        type: 'SYSTEM',
        link: '/appliances',
      },
    });

    const refreshed = await prisma.appliance.findMany({ where: { userId } });
    const activeWatts = refreshed.filter((a) => a.isOn).reduce((sum, a) => sum + a.powerRatingWatts, 0);

    sendSuccess(
      res,
      {
        scene,
        description,
        updatedCount,
        activeWatts,
        appliances: refreshed,
      },
      description
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to activate preset scene', 500);
  }
}

