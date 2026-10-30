import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { simulationService } from '../services/simulation.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getLiveReading(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const telemetry = await simulationService.generateInstantTelemetry(userId);
    sendSuccess(res, telemetry);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch live telemetry', 500);
  }
}

export async function toggleSimulation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { running } = req.body;
    const newState = simulationService.setRunningState(Boolean(running));
    sendSuccess(res, { isRunning: newState }, `Simulation ${newState ? 'started' : 'paused'}`);
  } catch (error: any) {
    sendError(res, 'Failed to toggle simulation', 500);
  }
}

export async function ingestReading(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const {
      activePowerKw,
      voltage = 230,
      current = 5.0,
      frequency = 50.0,
      powerFactor = 0.97,
      solarGenerationKw = 0,
      applianceId,
    } = req.body;

    const netLoad = activePowerKw - solarGenerationKw;
    const gridDrawKw = netLoad > 0 ? netLoad : 0;
    const gridExportKw = netLoad < 0 ? Math.abs(netLoad) : 0;

    const reading = await prisma.energyReading.create({
      data: {
        userId,
        applianceId,
        activePowerKw,
        voltage,
        current,
        frequency,
        powerFactor,
        energyConsumedKwh: Number((activePowerKw * (1 / 60)).toFixed(4)),
        solarGenerationKw,
        gridDrawKw,
        gridExportKw,
        isSimulated: false, // Ingested via API/Hardware
      },
    });

    sendSuccess(res, reading, 'Reading ingested successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to ingest reading', 500);
  }
}

export async function getRecentReadings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 30;

    const readings = await prisma.energyReading.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        appliance: {
          select: { name: true, category: true },
        },
      },
    });

    sendSuccess(res, readings.reverse());
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch readings', 500);
  }
}
