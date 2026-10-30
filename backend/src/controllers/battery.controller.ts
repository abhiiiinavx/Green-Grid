import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { calculateBatteryBackup } from '../utils/calculations.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getBatteryDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    let battery = await prisma.battery.findUnique({ where: { userId } });

    if (!battery) {
      battery = await prisma.battery.create({
        data: {
          userId,
          capacityKwh: 10.0,
          currentChargePercent: 80.0,
          maxChargeRateKw: 3.3,
          maxDischargeRateKw: 3.3,
          state: 'STANDBY',
          healthPercent: 98.0,
          backupHoursEst: 6.8,
        },
      });
    }

    const currentLoadKw = 1.45; // Base home active load
    const backupHours = calculateBatteryBackup(battery.capacityKwh, battery.currentChargePercent, currentLoadKw);
    const availableEnergyKwh = Number(((battery.capacityKwh * battery.currentChargePercent) / 100).toFixed(1));

    // Simulated 24h charge/discharge profile
    const now = new Date();
    const battery24h = Array.from({ length: 24 }).map((_, h) => {
      let soc = 70;
      if (h >= 10 && h <= 16) soc = Math.min(100, 60 + (h - 10) * 6); // Solar charging midday
      else if (h >= 18 && h <= 23) soc = Math.max(35, 96 - (h - 18) * 9); // Discharging evening
      else soc = 45 + (h * 1.5); // Baseline standby
      return {
        time: `${String(h).padStart(2, '0')}:00`,
        socPercent: Number(soc.toFixed(1)),
        powerKw: h >= 10 && h <= 16 ? 2.4 : h >= 18 && h <= 23 ? -1.8 : 0,
      };
    });

    sendSuccess(res, {
      battery: {
        ...battery,
        availableEnergyKwh,
        estimatedBackupHours: backupHours,
      },
      telemetry24h: battery24h,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch battery details', 500);
  }
}

export async function updateBattery(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updated = await prisma.battery.upsert({
      where: { userId },
      update: req.body,
      create: { userId, ...req.body },
    });
    sendSuccess(res, updated, 'Battery configuration updated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update battery', 500);
  }
}
