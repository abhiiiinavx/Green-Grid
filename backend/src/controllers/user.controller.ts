import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    if (!profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    sendSuccess(res, profile);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch profile', 500);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const {
      name,
      phone,
      location,
      userType,
      monthlyBudget,
      energyGoalKwh,
      carbonGoalReduction,
      hasSolar,
      hasBattery,
      isOnboarded,
    } = req.body;

    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        phone,
        location,
        userType,
        monthlyBudget,
        energyGoalKwh,
        carbonGoalReduction,
        hasSolar,
        hasBattery,
        isOnboarded,
      },
      create: {
        userId,
        phone,
        location: location || 'Bengaluru, India',
        userType: userType || 'HOME',
        monthlyBudget: monthlyBudget || 3500,
        energyGoalKwh: energyGoalKwh || 250,
        carbonGoalReduction: carbonGoalReduction || 15,
        hasSolar: hasSolar ?? true,
        hasBattery: hasBattery ?? true,
        isOnboarded: isOnboarded ?? true,
      },
    });

    sendSuccess(res, updatedProfile, 'Profile updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update profile', 500);
  }
}

export async function completeOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { userType, approxMonthlyUsageKwh, tariffRate, applianceCount, hasSolar, hasBattery, location } = req.body;

    // 1. Update user profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        userType,
        energyGoalKwh: Number((approxMonthlyUsageKwh * 0.9).toFixed(0)), // 10% reduction goal
        monthlyBudget: Number((approxMonthlyUsageKwh * (tariffRate || 6.5)).toFixed(0)),
        hasSolar,
        hasBattery,
        location: location || 'Bengaluru, India',
        isOnboarded: true,
      },
      create: {
        userId,
        userType,
        energyGoalKwh: Number((approxMonthlyUsageKwh * 0.9).toFixed(0)),
        monthlyBudget: Number((approxMonthlyUsageKwh * (tariffRate || 6.5)).toFixed(0)),
        hasSolar,
        hasBattery,
        location: location || 'Bengaluru, India',
        isOnboarded: true,
      },
    });

    // 2. Update solar and battery states
    if (hasSolar) {
      await prisma.solarSystem.upsert({
        where: { userId },
        update: { isActive: true },
        create: { userId, capacityKw: 4.5, isActive: true },
      });
    }

    if (hasBattery) {
      await prisma.battery.upsert({
        where: { userId },
        update: { capacityKwh: 10.0 },
        create: { userId, capacityKwh: 10.0, currentChargePercent: 80.0 },
      });
    }

    // 3. Create default initial appliances if none exist
    const existingAppliances = await prisma.appliance.count({ where: { userId } });
    if (existingAppliances === 0) {
      const defaultApps = [
        { name: 'Air Conditioner', category: 'COOLING', powerRatingWatts: 1500, isOn: true, room: 'Living Room', dailyAvgHours: 5 },
        { name: 'Refrigerator', category: 'KITCHEN', powerRatingWatts: 250, isOn: true, room: 'Kitchen', dailyAvgHours: 24 },
        { name: 'Water Geyser', category: 'HEATING', powerRatingWatts: 2000, isOn: false, room: 'Bathroom', dailyAvgHours: 1.5 },
        { name: 'Lighting System', category: 'LIGHTING', powerRatingWatts: 120, isOn: true, room: 'Main House', dailyAvgHours: 6 },
      ];

      for (const app of defaultApps) {
        await prisma.appliance.create({
          data: { userId, ...app },
        });
      }
    }

    sendSuccess(res, profile, 'Onboarding completed successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to complete onboarding', 500);
  }
}
