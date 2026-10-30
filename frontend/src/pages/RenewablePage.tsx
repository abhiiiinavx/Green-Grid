import React, { useState } from 'react';
import {
  Sun,
  BatteryCharging,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Leaf,
  Layers,
  Sparkles,
  TreePine,
  DollarSign,
  Power,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import { EnergyFlowDiagram } from '../components/dashboard/EnergyFlowDiagram.js';
import { useToast } from '../context/ToastContext.js';
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

export const RenewablePage: React.FC = () => {
  const { success } = useToast();
  const [batteryMode, setBatteryMode] = useState<'SELF_CONSUMPTION' | 'PEAK_SHAVING' | 'BACKUP_RESERVE'>('PEAK_SHAVING');

  const { data: solarData, isLoading: isSolarLoading } = useQuery({
    queryKey: ['solar-details'],
    queryFn: () => apiRequest('/solar'),
    refetchInterval: 5000,
  });

  const { data: batteryData, isLoading: isBatteryLoading } = useQuery({
    queryKey: ['battery-details'],
    queryFn: () => apiRequest('/battery'),
    refetchInterval: 5000,
  });

  const handleModeChange = (mode: 'SELF_CONSUMPTION' | 'PEAK_SHAVING' | 'BACKUP_RESERVE') => {
    setBatteryMode(mode);
    if (mode === 'PEAK_SHAVING') {
      success('Battery set to Peak Shaving: Discharges stored solar power between 6 PM - 10 PM to protect from ₹11.50/kWh rates.');
    } else if (mode === 'SELF_CONSUMPTION') {
      success('Battery set to Solar Priority: Minimizes grid interaction by matching all daytime and evening home loads.');
    } else {
      success('Battery set to Emergency Backup: Reserves 90% capacity for sudden blackout protection.');
    }
  };

  if (isSolarLoading || isBatteryLoading || !solarData || !batteryData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { system: solar, live: solarLive, generationHistory } = solarData;
  const { battery, telemetry24h } = batteryData;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Renewable Energy: Solar & Battery Storage
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time rooftop photovoltaic generation, inverter telemetry, and battery state-of-charge
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Grid Intertie Synchronized
          </span>
        </div>
      </div>

      {/* Humanistic Environmental & Grid Independence Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Solar Self-Sufficiency</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {solarLive.solarCoveragePercent || 78}% Clean Solar
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
              Only {(100 - (solarLive.solarCoveragePercent || 78))}% drawn from utility grid
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border-teal-500/30 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Carbon Avoided Today</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              12.8 kg CO₂ avoided
            </div>
            <div className="text-[10px] text-teal-600 dark:text-teal-400">
              Equivalent to planting 0.6 trees or driving 42 km in an EV
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Solar ROI Accrued</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              ₹42,850 Lifetime
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400">
              System payback on track: 3.2 years remaining
            </div>
          </div>
        </Card>
      </div>

      {/* 4 Renewable KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Solar Live Power</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 mt-1.5">
            {solarLive.currentGenerationKw} <span className="text-xs font-normal text-slate-500">kW</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Capacity: {solar.capacityKw} kW ({solar.panelCount} Monocrystalline Panels)
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Today's Generation</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {solarLive.todayGenerationKwh} <span className="text-xs font-normal text-slate-500">kWh</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            Covers {solarLive.solarCoveragePercent}% of daily demand
          </p>
        </Card>

        <Card className="p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Battery SOC</span>
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {battery.currentChargePercent.toFixed(0)}%
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Available: {battery.availableEnergyKwh} kWh / {battery.capacityKwh} kWh
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Estimated Backup</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {battery.estimatedBackupHours} <span className="text-xs font-normal text-slate-500">Hours</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            State: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{battery.state}</span>
          </p>
        </Card>
      </div>

      {/* Energy Flow Diagram */}
      <EnergyFlowDiagram
        solarKw={solarLive.currentGenerationKw}
        homeLoadKw={1.45}
        batterySocPercent={battery.currentChargePercent}
        batteryPowerKw={battery.state === 'CHARGING' ? 1.8 : -1.2}
        gridDrawKw={0.0}
        gridExportKw={solarLive.gridExportKwh > 0 ? 1.2 : 0}
      />

      {/* Smart Battery Storage Operating Mode Strategy */}
      <Card className="p-5 border-emerald-500/30 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Smart Storage Operating Profile
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select how your {battery.capacityKwh} kWh lithium storage bank coordinates with solar generation and utility time-of-use tariffs
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
            <button
              onClick={() => handleModeChange('PEAK_SHAVING')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                batteryMode === 'PEAK_SHAVING'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Peak Shaving (Auto)
            </button>
            <button
              onClick={() => handleModeChange('SELF_CONSUMPTION')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                batteryMode === 'SELF_CONSUMPTION'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Solar Priority
            </button>
            <button
              onClick={() => handleModeChange('BACKUP_RESERVE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                batteryMode === 'BACKUP_RESERVE'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Storm Backup
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300">
            {batteryMode === 'PEAK_SHAVING' && (
              <>
                <strong className="text-emerald-600 dark:text-emerald-400">Peak Shaving Active: </strong>
                Storing {solarLive.currentGenerationKw} kW rooftop solar during noon; scheduled discharge begins at 18:00 to bypass ₹11.50/kWh peak charges.
              </>
            )}
            {batteryMode === 'SELF_CONSUMPTION' && (
              <>
                <strong className="text-emerald-600 dark:text-emerald-400">Solar Priority Active: </strong>
                Maximizing local consumption to achieve near-zero carbon footprint and complete grid independence.
              </>
            )}
            {batteryMode === 'BACKUP_RESERVE' && (
              <>
                <strong className="text-emerald-600 dark:text-emerald-400">Emergency Backup Reserve Active: </strong>
                Maintaining battery charge at 90%+ to protect critical circuits against blackout interruptions.
              </>
            )}
          </span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-4 font-semibold">
            ● Active Profile
          </span>
        </div>
      </Card>

      {/* 24-Hour Battery Storage Charge & Discharge Curve */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="24-Hour Battery State of Charge (SOC %)"
          subtitle="Cyclic solar charging during daytime and off-grid dispatch during evening peak"
        />
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetry24h} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="socPercent"
                name="Battery Charge (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#batteryGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
