import React, { useState } from 'react';
import {
  BarChart3,
  TrendingDown,
  Clock,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  Zap,
  Leaf,
  Layers,
  Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<string>('30d'); // 'today' | '7d' | '30d' | '3m' | '6m'

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => apiRequest(`/analytics?period=${period}`),
  });

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const { summary, timeOfUse, dayDistribution, categoryBreakdown, timeline } = analytics;

  const categoryColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Energy Analytics & Trend Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-period comparative load curves, Time-of-Use splits, and efficiency benchmarks
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '3m', label: '3 Months' },
            { key: '6m', label: '6 Months' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                period === tab.key
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Consumed</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {summary.totalKwh.toLocaleString()} <span className="text-xs font-normal text-slate-500">kWh</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            {summary.consumptionDelta.formatted} vs prior {period}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Incurred Cost</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            ₹{summary.totalCost.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Effective avg: ₹{(summary.totalCost / (summary.totalKwh || 1)).toFixed(2)} / kWh
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rooftop Solar Generated</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 mt-1.5">
            {summary.totalSolarKwh.toLocaleString()} <span className="text-xs font-normal text-slate-500">kWh</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Offset: ~₹{(summary.totalSolarKwh * 6.5).toFixed(0)} grid costs
          </p>
        </Card>

        <Card className="p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Efficiency Index</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {summary.efficiencyScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            Grade: A (Optimized Load Profile)
          </p>
        </Card>
      </div>

      {/* Executive Analytical Summary Box */}
      <Card className="p-4 sm:p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Automated Executive Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              {summary.executiveSummary}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Consumption & Solar Bar Chart Timeline */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Daily Electricity Trends"
          subtitle={`Total kWh consumed vs Rooftop Solar generation across the selected ${period} window`}
        />
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Bar dataKey="totalKwh" name="Consumption (kWh)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="solarKwh" name="Solar Generation (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Row: Peak vs Off-Peak (ToU) & Weekday vs Weekend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time of Use (Peak vs Off-Peak) */}
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Time-of-Use Load Analysis"
            subtitle="Distribution between Peak Hours (6 PM – 10 PM) and Off-Peak Base"
          />
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase">Peak Tariff Hours</p>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-300 mt-1">
                {timeOfUse.peakPercentage}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{timeOfUse.peakKwh} kWh @ ₹8.50/kWh</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Off-Peak Hours</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-300 mt-1">
                {timeOfUse.offPeakPercentage}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{timeOfUse.offPeakKwh} kWh @ ₹5.50/kWh</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            💡 Shifting 15% of your evening peak load to afternoon solar windows could reduce your monthly bill by approx ₹280.
          </p>
        </Card>

        {/* Weekday vs Weekend Comparative Distribution */}
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Weekday vs Weekend Distribution"
            subtitle="Comparing occupancy and domestic load profiles"
          />
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Weekday Avg</p>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {dayDistribution.avgWeekdayKwh} <span className="text-xs text-slate-500">kWh/day</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Monday – Friday</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Weekend Avg</p>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {dayDistribution.avgWeekendKwh} <span className="text-xs text-slate-500">kWh/day</span>
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {dayDistribution.differenceFormatted} variance
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            Weekend surge is primarily driven by continuous AC usage and daytime cooking/laundry appliances.
          </p>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Appliance Category Breakdown"
          subtitle="Cumulative consumption and expense distribution across categories"
        />
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Appliances</th>
                <th className="py-2.5 px-3">Total kWh</th>
                <th className="py-2.5 px-3">Share (%)</th>
                <th className="py-2.5 px-3">Estimated Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categoryBreakdown.map((cat: any, idx: number) => (
                <tr key={cat.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} />
                    {cat.category}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{cat.count} devices</td>
                  <td className="py-3 px-3 font-mono font-semibold">{cat.kwh} kWh</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-400">{cat.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{cat.cost.toLocaleString()}
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
