import React from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const ForecastsPage: React.FC = () => {
  // 1. Fetch 24-Hour Forecast
  const { data: hourlyData, isLoading: isHourlyLoading } = useQuery({
    queryKey: ['hourly-forecast'],
    queryFn: () => apiRequest('/forecasts/hourly'),
  });

  // 2. Fetch 7-Day Forecast
  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: ['daily-forecast'],
    queryFn: () => apiRequest('/forecasts/daily'),
  });

  if (isHourlyLoading || isDailyLoading || !hourlyData || !dailyData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const { points: hourlyPoints, activeAnomalies } = hourlyData;
  const { days: dailyPoints } = dailyData;

  const total24hKwh = hourlyPoints.reduce((sum: number, p: any) => sum + p.predictedKwh, 0);
  const total24hCost = hourlyPoints.reduce((sum: number, p: any) => sum + p.predictedCost, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Demand Prediction & Anomaly Detection
            </h1>
            <Badge variant="purple" size="sm">
              Model: XGBoost-Ensemble v2.1
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Machine learning forecast of upcoming 24-hour hourly load curves and continuous anomaly surveillance
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-purple-500/30">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Next 24h Projected Demand</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1.5">
            {total24hKwh.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Projected 24h Electricity Cost: ~₹{total24hCost.toFixed(0)}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Peak Hour Window Alert</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 mt-1.5">
            6:00 PM – 10:00 PM
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Highest predicted draw: 1.48 kW @ 8:00 PM
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Anomaly Surveillance</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {activeAnomalies && activeAnomalies.length > 0 ? `${activeAnomalies.length} Detected` : 'All Clear'}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Standard deviation threshold: 2.0σ
          </p>
        </Card>
      </div>

      {/* Live Anomaly Detection Alerts (if detected) */}
      {activeAnomalies && activeAnomalies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Active Machine Learning Anomaly Detections</span>
          </h3>
          {activeAnomalies.map((ano: any, i: number) => (
            <Card key={i} className="p-4 border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    {ano.type} — {ano.timeRange}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {ano.description}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Suggested Action: {ano.recommendedAction}</span>
                  </p>
                </div>
                <Badge variant="warning">{ano.severity}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 24-Hour Demand Forecast Chart with Confidence Intervals */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="24-Hour Ahead Hourly Demand Forecast"
          subtitle="Machine learning prediction with statistical confidence bounds (90% CI)"
        />
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Area
                type="monotone"
                dataKey="predictedKwh"
                name="Predicted Load (kWh)"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#predGradient)"
              />
              <Line
                type="monotone"
                dataKey="confidenceHigh"
                name="Upper Bound (+15%)"
                stroke="#c084fc"
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="confidenceLow"
                name="Lower Bound (-12%)"
                stroke="#a855f7"
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 7-Day Ahead Daily Forecast Table */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="7-Day Daily Demand Outlook"
          subtitle="Projected day-by-day consumption volume and daily electricity cost"
        />
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3">Predicted kWh</th>
                <th className="py-2.5 px-3">Confidence Interval</th>
                <th className="py-2.5 px-3">Estimated Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dailyPoints.map((d: any) => (
                <tr key={d.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">{d.date}</td>
                  <td className="py-3 px-3 text-slate-500">{d.dayName}</td>
                  <td className="py-3 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">{d.predictedKwh} kWh</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {d.confidenceLow} – {d.confidenceHigh} kWh
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ₹{d.predictedCost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
