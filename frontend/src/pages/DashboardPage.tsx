import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Calendar,
  Sparkles,
  Sun,
  BatteryCharging,
  TrendingDown,
  Download,
  Plus,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { DashboardData, EnergyConsumptionPoint } from '../types/index.js';
import { StatCard } from '../components/common/StatCard.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { DashboardSkeleton } from '../components/common/SkeletonLoader.js';
import { EnergyFlowDiagram } from '../components/dashboard/EnergyFlowDiagram.js';
import { ExportReportModal } from '../components/dashboard/ExportReportModal.js';
import { SmartScenesBar } from '../components/dashboard/SmartScenesBar.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '6m'>('today');
  const [metric, setMetric] = useState<'kwh' | 'cost'>('kwh');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Time-aware warm human greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // 1. Fetch Main Dashboard Summary
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest('/dashboard'),
    refetchInterval: 6000,
  });

  // 2. Fetch Time-series Chart Data based on selected timeframe & metric
  const { data: chartData, isLoading: isChartLoading } = useQuery<EnergyConsumptionPoint[]>({
    queryKey: ['dashboard-chart', timeframe, metric],
    queryFn: () => apiRequest(`/dashboard/chart?timeframe=${timeframe}&metric=${metric}`),
  });

  // Toggle Appliance ON/OFF directly from dashboard
  const toggleApplianceMutation = useMutation({
    mutationFn: ({ id, isOn }: { id: string; isOn: boolean }) =>
      apiRequest(`/appliances/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isOn }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      success(`${data.name} turned ${data.isOn ? 'ON' : 'OFF'}`);
    },
    onError: () => {
      error('Failed to toggle appliance state');
    },
  });

  if (isDashboardLoading || !dashboard) {
    return <DashboardSkeleton />;
  }

  const { kpis, energyFlow, applianceBreakdown, smartInsights, user, tariff } = dashboard;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-elevated text-xs font-sans">
          <p className="font-semibold text-slate-200 mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 font-mono flex items-center justify-between gap-4">
              <span>Total Consumption:</span>
              <span className="font-bold">
                {payload[0]?.value} {metric === 'kwh' ? 'kWh' : '₹'}
              </span>
            </p>
            {payload[1] && (
              <p className="text-amber-400 font-mono flex items-center justify-between gap-4">
                <span>Solar Generation:</span>
                <span className="font-bold">
                  {payload[1]?.value} {metric === 'kwh' ? 'kWh' : '₹'}
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const hour = new Date().getHours();
  const isPeakHour = hour >= 18 && hour <= 22;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER GREETING & ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 rounded-2xl border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, {authUser?.name?.split(' ')[0] || 'Friend'}!
            </h1>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">
              {user.userType} Property
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>📍 {user.location}</span>
            <span>•</span>
            <span className={isPeakHour ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'}>
              {isPeakHour ? '⚡ Peak Tariff Window (₹8.50/kWh)' : '🟢 Normal Off-Peak Window (₹4.75/kWh)'}
            </span>
            <span>•</span>
            <span className="text-slate-500">
              Solar generation active & meeting {Math.min(100, Math.round(((energyFlow.solarGenerationKw || 0) / Math.max(0.1, energyFlow.homeLoadKw || 1)) * 100))}% of instantaneous load
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchDashboard()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync Telemetry
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Audit Report
          </Button>

          <Link to="/appliances">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. SMART LIVING PRESETS BAR */}
      <SmartScenesBar />

      {/* 3. EVERYDAY HUMAN EQUIVALENTS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-xs">
          <span className="text-xl">⚡</span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Run Rate: ~₹{(kpis.currentPower.valueKw * 6.5).toFixed(1)} / hr
            </p>
            <p className="text-[11px] text-slate-500">
              Equivalent to 1 standard ceiling fan + 1 refrigerator
            </p>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-xs">
          <span className="text-xl">🌳</span>
          <div>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              {kpis.carbonEmissions.treesEquivalent} Trees Planted
            </p>
            <p className="text-[11px] text-slate-500">
              Offsetting {kpis.carbonEmissions.todayKg} kg carbon emissions today
            </p>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-xs">
          <span className="text-xl">☕</span>
          <div>
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              ₹{(kpis.todayEnergy.valueKwh * 6.5).toFixed(0)} Today's Cost
            </p>
            <p className="text-[11px] text-slate-500">
              Pacing {kpis.estimatedBill.comparison} of your monthly budget goal
            </p>
          </div>
        </div>
      </div>


      {/* 2. MAIN KPI SECTION (5 Core KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Current Power"
          value={kpis.currentPower.valueKw.toFixed(2)}
          unit="kW"
          subtitle="Instant Active Load"
          icon={<Zap className="w-4 h-4 text-emerald-500" />}
          status={kpis.currentPower.status}
        />

        <StatCard
          title="Today's Usage"
          value={kpis.todayEnergy.valueKwh.toFixed(1)}
          unit="kWh"
          comparison={kpis.todayEnergy.comparison}
          isIncrease={kpis.todayEnergy.isIncrease}
          comparisonLabel="vs yesterday"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
        />

        <StatCard
          title="This Month"
          value={kpis.thisMonthEnergy.valueKwh.toFixed(0)}
          unit="kWh"
          comparison={kpis.thisMonthEnergy.comparison}
          isIncrease={kpis.thisMonthEnergy.isIncrease}
          comparisonLabel="vs last month"
          icon={<TrendingDown className="w-4 h-4 text-purple-500" />}
        />

        <StatCard
          title="Estimated Bill"
          value={`₹${kpis.estimatedBill.value.toLocaleString()}`}
          subtitle={`Proj: ₹${kpis.estimatedBill.projectedMonthEnd.toLocaleString()}`}
          comparison={kpis.estimatedBill.comparison}
          isIncrease={kpis.estimatedBill.isIncrease}
          comparisonLabel="budget pace"
          icon={<Sliders className="w-4 h-4 text-amber-500" />}
        />

        <StatCard
          title="Carbon Emissions"
          value={kpis.carbonEmissions.valueKg.toFixed(0)}
          unit="kg"
          subtitle={`~${kpis.carbonEmissions.treesEquivalent} Trees Eq.`}
          icon={<Sparkles className="w-4 h-4 text-teal-500" />}
        />
      </div>

      {/* 3. MAIN VISUALIZATION ROW: CONSUMPTION CHART & APPLIANCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Consumption Area Chart */}
        <Card className="lg:col-span-2 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Energy Consumption Curve
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Load profile with solar generation overlay and peak tariff markers
              </p>
            </div>

            {/* Timeframe & Metric Selector Controls */}
            <div className="flex items-center gap-2">
              {/* Metric Toggle: kWh / Cost */}
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setMetric('kwh')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    metric === 'kwh'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  kWh
                </button>
                <button
                  onClick={() => setMetric('cost')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    metric === 'cost'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Cost (₹)
                </button>
              </div>

              {/* Timeframe selector: Today / 7D / 30D / 6M */}
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium">
                {(['today', '7d', '30d', '6m'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-2.5 py-1 rounded-md transition-colors uppercase ${
                      timeframe === t
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recharts Area Container */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                <Area
                  type="monotone"
                  name={metric === 'kwh' ? 'Consumption (kWh)' : 'Cost (₹)'}
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#consumptionGradient)"
                />
                {user.hasSolar && (
                  <Area
                    type="monotone"
                    name={metric === 'kwh' ? 'Solar (kWh)' : 'Solar Savings (₹)'}
                    dataKey="solarValue"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#solarGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Evening peak rate (₹8.50/kWh) applies 6:00 PM – 10:00 PM
            </span>
            <Link to="/analytics" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1">
              View Detailed Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Right 1 Col: Horizontal Appliance Breakdown with Direct Toggle */}
        <Card className="p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Appliance Share
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time power & daily % contribution
                </p>
              </div>
              <Link to="/appliances" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-3.5 max-h-[310px] overflow-y-auto pr-1">
              {applianceBreakdown.slice(0, 5).map((app) => (
                <div key={app.id} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${app.isOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {app.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {app.percentage}%
                      </span>
                      {/* Interactive Power Switch */}
                      <button
                        onClick={() =>
                          toggleApplianceMutation.mutate({ id: app.id, isOn: !app.isOn })
                        }
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold transition-colors ${
                          app.isOn
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Click to toggle appliance state"
                      >
                        {app.isOn ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Bar Progress */}
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        app.isOn ? 'bg-emerald-500' : 'bg-slate-400/50'
                      }`}
                      style={{ width: `${Math.max(4, app.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{app.powerRatingWatts}W • {app.room}</span>
                    <span>₹{app.estimatedMonthlyCost}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/appliances"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
            >
              + {Math.max(0, applianceBreakdown.length - 5)} other connected devices
            </Link>
          </div>
        </Card>
      </div>

      {/* 4. THIRD SECTION: REAL-TIME ENERGY FLOW */}
      {user.hasSolar && (
        <EnergyFlowDiagram
          solarKw={energyFlow.solarGenerationKw}
          homeLoadKw={energyFlow.homeLoadKw}
          batterySocPercent={energyFlow.batterySocPercent}
          batteryPowerKw={energyFlow.batteryPowerKw}
          gridDrawKw={energyFlow.gridDrawKw}
          gridExportKw={energyFlow.gridExportKw}
        />
      )}

      {/* 5. FOURTH SECTION: SMART REAL-TIME INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {smartInsights.map((insight) => (
          <Card
            key={insight.id}
            className={`p-4 border-l-4 ${
              insight.type === 'POSITIVE'
                ? 'border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                : insight.type === 'ALERT'
                ? 'border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
                : 'border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {insight.title}
              </h4>
              <Badge
                size="sm"
                variant={insight.type === 'POSITIVE' ? 'success' : insight.type === 'ALERT' ? 'warning' : 'info'}
              >
                {insight.metric}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {insight.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Export Report Modal */}
      <ExportReportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
};
