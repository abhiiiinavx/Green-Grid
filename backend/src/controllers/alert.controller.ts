import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const severity = req.query.severity as string;

    const where: any = { userId, isDismissed: false };
    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    const alerts = await prisma.energyAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        appliance: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    const unreadCount = alerts.filter((a) => !a.isRead).length;

    sendSuccess(res, {
      alerts,
      unreadCount,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch alerts', 500);
  }
}

export async function markAlertAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (id === 'all') {
      await prisma.energyAlert.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      sendSuccess(res, null, 'All alerts marked as read');
      return;
    }

    const alert = await prisma.energyAlert.findFirst({ where: { id, userId } });
    if (!alert) {
      sendError(res, 'Alert not found', 404);
      return;
    }

    const updated = await prisma.energyAlert.update({
      where: { id },
      data: { isRead: true },
    });

    sendSuccess(res, updated, 'Alert marked as read');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update alert', 500);
  }
}

export async function dismissAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await prisma.energyAlert.updateMany({
      where: { id, userId },
      data: { isDismissed: true },
    });

    sendSuccess(res, null, 'Alert dismissed');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to dismiss alert', 500);
  }
}

export async function simulateAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { alertType = 'UNUSUAL_USAGE', severity = 'WARNING' } = req.body;

    const appliance = await prisma.appliance.findFirst({ where: { userId } });

    const presets: Record<string, { title: string; message: string; val: number; thresh: number }> = {
      UNUSUAL_USAGE: {
        title: 'Abnormal Power Spike Detected',
        message: 'Sudden load spike of 2.8 kW detected across high-power circuits. 42% higher than your regular baseline.',
        val: 2.8,
        thresh: 2.0,
      },
      HIGH_CONSUMPTION: {
        title: 'Appliance Exceeding Daily Budget',
        message: `${appliance?.name || 'Living Room AC'} has drawn 6.2 kWh today, crossing the recommended 4.5 kWh threshold.`,
        val: 6.2,
        thresh: 4.5,
      },
      BUDGET_THRESHOLD: {
        title: 'Monthly Budget Threshold Exceeded',
        message: 'Your home has consumed 82% of its monthly energy quota with 10 days remaining in the billing cycle.',
        val: 82,
        thresh: 80,
      },
      SOLAR_DROP: {
        title: 'Unexpected Solar Output Drop',
        message: 'Solar panel generation dipped by 65% during peak midday sunlight hours. Check for shading or dust accumulation.',
        val: 1.1,
        thresh: 3.5,
      },
    };

    const chosen = presets[alertType] || presets.UNUSUAL_USAGE;

    const alert = await prisma.energyAlert.create({
      data: {
        userId,
        applianceId: appliance?.id,
        title: chosen.title,
        message: chosen.message,
        alertType,
        severity,
        metricValue: chosen.val,
        thresholdValue: chosen.thresh,
        isRead: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: `⚠️ Alert: ${chosen.title}`,
        message: chosen.message,
        type: 'ALERT',
        link: '/alerts',
      },
    });

    sendSuccess(res, alert, 'Simulated safety alert triggered successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to simulate alert', 500);
  }
}

