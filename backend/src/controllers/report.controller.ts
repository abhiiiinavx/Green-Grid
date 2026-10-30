import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function exportReportData(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const format = (req.query.format as string) || 'json'; // 'json' | 'csv'

    const [user, profile, records, appliances, recommendations] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.energyConsumption.findMany({
        where: { userId, hour: null },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      prisma.appliance.findMany({ where: { userId } }),
      prisma.energyRecommendation.findMany({ where: { userId, isDismissed: false } }),
    ]);

    const totalKwh = records.reduce((sum, r) => sum + r.totalKwh, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const totalSolarKwh = records.reduce((sum, r) => sum + r.solarKwh, 0);
    const totalCarbonKg = records.reduce((sum, r) => sum + r.carbonKg, 0);

    if (format === 'csv') {
      const csvHeader = 'Date,Total_kWh,Cost_INR,Solar_kWh,Grid_kWh,Peak_kWh,OffPeak_kWh,Carbon_kg\n';
      const csvRows = records
        .map((r) => `${r.date},${r.totalKwh},${r.cost},${r.solarKwh},${r.gridKwh},${r.peakKwh},${r.offPeakKwh},${r.carbonKg}`)
        .join('\n');
      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="green-grid-audit-report-${Date.now()}.csv"`);
      res.send(csvContent);
      return;
    }

    sendSuccess(res, {
      reportMetadata: {
        title: 'Green Grid — Smart Energy Audit Report',
        generatedAt: new Date().toISOString(),
        user: user?.name,
        email: user?.email,
        location: profile?.location,
        period: 'Past 30 Days',
      },
      summary: {
        totalConsumptionKwh: Number(totalKwh.toFixed(1)),
        totalCost: Number(totalCost.toFixed(0)),
        totalSolarKwh: Number(totalSolarKwh.toFixed(1)),
        totalCarbonEmissionsKg: Number(totalCarbonKg.toFixed(1)),
        avgDailyKwh: Number((totalKwh / Math.max(1, records.length)).toFixed(2)),
      },
      appliances: appliances.map((a) => ({
        name: a.name,
        category: a.category,
        powerRatingWatts: a.powerRatingWatts,
        dailyHours: a.dailyAvgHours,
        room: a.room,
      })),
      recommendations: recommendations.map((r) => ({
        title: r.title,
        impactLevel: r.impactLevel,
        potentialMonthlySavingsCost: r.potentialMonthlySavingsCost,
        potentialMonthlySavingsKwh: r.potentialMonthlySavingsKwh,
        suggestedAction: r.suggestedAction,
      })),
      records,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to export report', 500);
  }
}
