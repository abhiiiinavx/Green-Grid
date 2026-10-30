import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { energyService } from '../services/energy.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = await energyService.getDashboardData(userId);
    sendSuccess(res, data);
  } catch (error: any) {
    console.error('getDashboard error:', error);
    sendError(res, error.message || 'Failed to fetch dashboard data', 500);
  }
}

export async function getDashboardChart(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const timeframe = (req.query.timeframe as string) || 'today';
    const metric = (req.query.metric as string) || 'kwh';

    const chartData = await energyService.getConsumptionChartData(userId, timeframe, metric);
    sendSuccess(res, chartData);
  } catch (error: any) {
    console.error('getDashboardChart error:', error);
    sendError(res, error.message || 'Failed to fetch chart data', 500);
  }
}
