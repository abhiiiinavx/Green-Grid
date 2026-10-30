import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    sendSuccess(res, {
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch notifications', 500);
  }
}

export async function markNotificationAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      sendSuccess(res, null, 'All notifications marked as read');
      return;
    }

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    sendSuccess(res, null, 'Notification marked as read');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update notification', 500);
  }
}
