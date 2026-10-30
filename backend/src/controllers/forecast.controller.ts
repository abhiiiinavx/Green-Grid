import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { aiService } from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getHourlyForecast(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const forecast = await aiService.get24HourForecast(userId);
    const anomalies = await aiService.detectAnomalies(userId);

    sendSuccess(res, {
      forecastType: '24_HOUR_HOURLY',
      modelVersion: 'green-xgb-forecast-v2.1',
      points: forecast,
      activeAnomalies: anomalies,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch hourly forecast', 500);
  }
}

export async function getDailyForecast(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const forecast = await aiService.get7DayForecast(userId);
    sendSuccess(res, {
      forecastType: '7_DAY_DAILY',
      modelVersion: 'green-prophet-ensemble-v2.0',
      days: forecast,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch daily forecast', 500);
  }
}

export async function getAnomalies(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const anomalies = await aiService.detectAnomalies(userId);
    sendSuccess(res, anomalies);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to detect anomalies', 500);
  }
}
