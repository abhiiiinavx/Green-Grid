import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Gauge,
  Play,
  Pause,
  PlusCircle,
  Radio,
  Sliders,
  CheckCircle2,
  Clock,
  Cpu,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useToast } from '../context/ToastContext.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const EnergyMonitoringPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  // Manual IoT packet injection state
  const [simPowerKw, setSimPowerKw] = useState(2.1);
  const [simVoltage, setSimVoltage] = useState(230);
  const [simCurrent, setSimCurrent] = useState(9.1);

  // 1. Live Instantaneous Reading with 2-second polling
  const { data: liveData } = useQuery({
    queryKey: ['live-reading'],
    queryFn: () => apiRequest('/energy/live'),
    refetchInterval: 2500,
  });

  // 2. Recent readings stream
  const { data: recentReadings } = useQuery({
    queryKey: ['recent-readings'],
    queryFn: () => apiRequest('/energy/readings?limit=20'),
    refetchInterval: 3000,
  });

  // Toggle Simulation
  const toggleMutation = useMutation({
    mutationFn: (running: boolean) =>
      apiRequest('/energy/simulation/toggle', {
        method: 'POST',
        body: JSON.stringify({ running }),
      }),
    onSuccess: (data) => {
      setIsSimRunning(data.isRunning);
      queryClient.invalidateQueries({ queryKey: ['live-reading'] });
      queryClient.invalidateQueries({ queryKey: ['recent-readings'] });
      success(`Simulation ${data.isRunning ? 'started' : 'paused'}`);
    },
  });

  // Ingest IoT Packet
  const ingestMutation = useMutation({
    mutationFn: (reading: any) =>
      apiRequest('/energy/ingest', {
        method: 'POST',
        body: JSON.stringify(reading),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-reading'] });
      queryClient.invalidateQueries({ queryKey: ['recent-readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('IoT Telemetry Packet ingested successfully');
      setIsIngestModalOpen(false);
    },
    onError: () => {
      error('Failed to ingest telemetry packet');
    },
  });

  const handleManualIngest = (e: React.FormEvent) => {
    e.preventDefault();
    ingestMutation.mutate({
      activePowerKw: simPowerKw,
      voltage: simVoltage,
      current: simCurrent,
      frequency: 50.0,
      powerFactor: 0.98,
    });
  };

  const chartPoints = (recentReadings || []).map((r: any) => {
    const t = new Date(r.timestamp);
    return {
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      powerKw: r.activePowerKw,
      voltage: r.voltage,
      current: r.current,
      solarKw: r.solarGenerationKw || 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Real-Time Energy Monitoring
            </h1>
            <Badge variant="success" dot={true}>
              {isSimRunning ? 'LIVE STREAMING' : 'PAUSED'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instantaneous smart meter electrical parameters and telemetry logging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isSimRunning ? 'outline' : 'primary'}
            size="sm"
            onClick={() => toggleMutation.mutate(!isSimRunning)}
            leftIcon={isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {isSimRunning ? 'Pause Stream' : 'Resume Stream'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsIngestModalOpen(true)}
            leftIcon={<PlusCircle className="w-3.5 h-3.5 text-emerald-500" />}
          >
            Custom IoT Packet
          </Button>
        </div>
      </div>

      {/* Human Observation Ticker */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📡</span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Live Grid Observation
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              {Number(liveData?.gridExportKw || 0) > 0
                ? `Rooftop solar is generating ${liveData?.solarGenerationKw || 3.8} kW and exporting ${liveData?.gridExportKw || 1.2} kW clean power back to the grid! ☀️`
                : `Home is drawing ${liveData?.activePowerKw || 1.45} kW. Voltage is stable at ${liveData?.voltage || 230.2}V with a 0.98 power factor.`}
            </p>
          </div>
        </div>

        {/* Quick Realistic Load Test Injector Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Inject Load:</span>
          {[
            { label: '☕ Kettle (+1.5kW)', kw: 2.8, v: 228, a: 12.2 },
            { label: '🍞 Microwave (+1.2kW)', kw: 2.4, v: 229, a: 10.4 },
            { label: '❄️ AC Surge (+1.45kW)', kw: 3.1, v: 227, a: 13.6 },
            { label: '🚗 EV (+3.3kW)', kw: 4.5, v: 224, a: 20.0 },
            { label: '🌙 Standby (0.35kW)', kw: 0.35, v: 231, a: 1.5 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() =>
                ingestMutation.mutate({
                  activePowerKw: preset.kw,
                  voltage: preset.v,
                  current: preset.a,
                  frequency: 50.0,
                  powerFactor: 0.98,
                })
              }
              className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>


      {/* 4 Electrical Parameter Gauge Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Power */}
        <Card className="p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Active Power</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {liveData?.activePowerKw?.toFixed(2) || '1.45'} <span className="text-sm font-normal text-slate-500">kW</span>
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Grid Draw: {liveData?.gridDrawKw?.toFixed(2) || '0.80'} kW</span>
            <span>Export: {liveData?.gridExportKw?.toFixed(2) || '0.00'} kW</span>
          </div>
        </Card>

        {/* RMS Voltage */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">RMS Voltage</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
            {liveData?.voltage?.toFixed(1) || '230.4'} <span className="text-sm font-normal text-slate-500">V</span>
          </p>
          <p className="mt-3 text-[11px] text-slate-500">
            Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Stable (230V Nominal ±2%)</span>
          </p>
        </Card>

        {/* AC Current */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">AC Current</span>
            <Radio className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
            {liveData?.current?.toFixed(2) || '6.30'} <span className="text-sm font-normal text-slate-500">A</span>
          </p>
          <p className="mt-3 text-[11px] text-slate-500">
            Active Circuit Breaker Rating: 32A Main
          </p>
        </Card>

        {/* Frequency & Power Factor */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Frequency & PF</span>
            <Gauge className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {liveData?.frequency?.toFixed(2) || '50.02'} <span className="text-xs text-slate-500">Hz</span>
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              PF: {liveData?.powerFactor?.toFixed(3) || '0.975'}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Grid Stability: Standard 50 Hz Synchronized
          </p>
        </Card>
      </div>

      {/* Live Power Stream Chart */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Live Active Power Stream (Past 20 Telemetry Frames)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Oscillating real-time draw updating every 2.5s
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
            2.5s POLLING
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="powerKw"
                name="Active Load (kW)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981' }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="solarKw"
                name="Solar Output (kW)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Hardware Connection Architecture Note */}
      <Card className="p-5 bg-slate-900 text-white border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                IoT Smart Meter & ESP32 Integration Ready
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Send live payloads to <code className="text-emerald-400 font-mono">POST /api/v1/energy/ingest</code> with bearer auth.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsIngestModalOpen(true)}
            className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
          >
            Test Telemetry Injection
          </Button>
        </div>
      </Card>

      {/* Manual Packet Ingest Modal */}
      <Modal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        title="Simulate Hardware IoT Packet"
        subtitle="Inject a live reading to test telemetry pipeline"
      >
        <form onSubmit={handleManualIngest} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Active Power (kW)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="15.0"
              value={simPowerKw}
              onChange={(e) => setSimPowerKw(parseFloat(e.target.value) || 1.5)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Voltage (V)
              </label>
              <input
                type="number"
                step="0.5"
                value={simVoltage}
                onChange={(e) => setSimVoltage(parseFloat(e.target.value) || 230)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current (A)
              </label>
              <input
                type="number"
                step="0.1"
                value={simCurrent}
                onChange={(e) => setSimCurrent(parseFloat(e.target.value) || 6.5)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsIngestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={ingestMutation.isPending}>
              Push Telemetry Frame
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
