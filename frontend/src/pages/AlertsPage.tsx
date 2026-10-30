import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Filter,
  Zap,
  ShieldCheck,
  Flame,
  Activity,
  ArrowRight,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Alert, AlertSeverity } from '../types/index.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import { useToast } from '../context/ToastContext.js';

export const AlertsPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);

  const { data, isLoading } = useQuery<{ alerts: Alert[]; unreadCount: number }>({
    queryKey: ['alerts', severityFilter],
    queryFn: () => apiRequest(`/alerts?severity=${severityFilter}`),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/alerts/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success('Alert marked as read');
    },
    onError: () => error('Failed to update alert'),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/alerts/${id}/dismiss`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success('Alert dismissed');
    },
    onError: () => error('Failed to dismiss alert'),
  });

  const simulateMutation = useMutation({
    mutationFn: ({ alertType, severity }: { alertType: string; severity: string }) =>
      apiRequest('/alerts/simulate', {
        method: 'POST',
        body: JSON.stringify({ alertType, severity }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success(`Simulated incident generated: ${res.title}`);
    },
    onError: (err: any) => error(err.message || 'Failed to trigger simulated alert'),
  });

  const quickEcoSceneMutation = useMutation({
    mutationFn: () =>
      apiRequest('/appliances/scenes/activate', {
        method: 'POST',
        body: JSON.stringify({ scene: 'ECO_SAVER' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('Eco-Saver activated! Heavy loads safely suspended to resolve grid stress.');
    },
    onError: () => error('Failed to activate scene'),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  const { alerts, unreadCount } = data;

  const severities: Array<{ key: string; label: string }> = [
    { key: 'ALL', label: 'All Alerts' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'WARNING', label: 'Warnings' },
    { key: 'INFO', label: 'Informational' },
  ];

  const getHumanisticAdvice = (alt: Alert) => {
    switch (alt.alertType) {
      case 'UNUSUAL_USAGE':
        return {
          reason: 'A sudden high-wattage spike was detected while grid tariffs or household base load were expected to be stable.',
          action: 'Check if multiple high-drain appliances (like geyser, iron, or microwave) were switched on simultaneously. Activating Eco-Saver will automatically stagger these loads.',
          canQuickFix: true,
        };
      case 'HIGH_CONSUMPTION':
        return {
          reason: 'This appliance has stayed continuously active past its typical daily duration, pushing it towards higher tariff brackets.',
          action: 'Lower the thermostat by 2°C or switch off until peak hours pass (after 10 PM) to protect your monthly savings.',
          canQuickFix: true,
        };
      case 'BUDGET_THRESHOLD':
        return {
          reason: 'You have used 80%+ of your planned energy quota while days still remain in the billing cycle.',
          action: 'Shift heavy washing machine and EV charging sessions to off-peak slots (10 PM - 6 AM) when unit prices are lowest.',
          canQuickFix: false,
        };
      case 'SOLAR_DROP':
        return {
          reason: 'Solar panel generation dipped unexpectedly despite clear midday weather conditions.',
          action: 'Inspect rooftop panels for dust, leaf debris, or temporary shadow obstructions. A quick rinse can restore up to 20% generation.',
          canQuickFix: false,
        };
      default:
        return {
          reason: 'Our AI grid monitor detected a telemetry variation outside your regular consumption pattern.',
          action: 'Review current active appliances or schedule an off-peak shift to maintain energy efficiency.',
          canQuickFix: false,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Alerts & Safety Guard
            </h1>
            {unreadCount > 0 && (
              <Badge variant="warning" size="sm">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time threshold breaches, abnormal power spikes, and actionable human-friendly resolution tips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markReadMutation.mutate('all')}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Grid Guard Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-500/30 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Protection Status</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Active Grid Guard 24/7</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Monitoring 8 circuits & solar</div>
          </div>
        </Card>

        <Card className="p-4 border-amber-500/30 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Unread Attention</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{unreadCount} Pending Notifications</div>
            <div className="text-[10px] text-slate-500">Updated in real-time</div>
          </div>
        </Card>

        <Card className="p-4 border-blue-500/30 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Safety Drills</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Simulation Engine Ready</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400">Test alerts on-demand below</div>
          </div>
        </Card>
      </div>

      {/* Safety Drill Simulator Box */}
      <Card className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 text-xs font-mono font-bold">
                TEST DRILL
              </span>
              <h3 className="text-sm font-bold">Interactive Safety Drill & Incident Simulator</h3>
            </div>
            <p className="text-xs text-slate-300">
              Test how GreenGrid protects your home by triggering simulated load events. Watch real-time alerts and recommendations trigger instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/40"
              onClick={() => simulateMutation.mutate({ alertType: 'UNUSUAL_USAGE', severity: 'CRITICAL' })}
              isLoading={simulateMutation.isPending}
              leftIcon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
            >
              Simulate Grid Spike
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/40"
              onClick={() => simulateMutation.mutate({ alertType: 'HIGH_CONSUMPTION', severity: 'WARNING' })}
              isLoading={simulateMutation.isPending}
              leftIcon={<Flame className="w-3.5 h-3.5 text-rose-400" />}
            >
              Simulate AC Overrun
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/40"
              onClick={() => simulateMutation.mutate({ alertType: 'BUDGET_THRESHOLD', severity: 'WARNING' })}
              isLoading={simulateMutation.isPending}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
            >
              Simulate 80% Budget
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/40"
              onClick={() => simulateMutation.mutate({ alertType: 'SOLAR_DROP', severity: 'INFO' })}
              isLoading={simulateMutation.isPending}
              leftIcon={<Sun className="w-3.5 h-3.5 text-yellow-300" />}
            >
              Simulate Solar Dip
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 w-fit text-xs font-medium">
        {severities.map((sev) => (
          <button
            key={sev.key}
            onClick={() => setSeverityFilter(sev.key)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              severityFilter === sev.key
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {sev.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            const isWarning = alt.severity === 'WARNING';
            const advice = getHumanisticAdvice(alt);

            return (
              <Card
                key={alt.id}
                className={`p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all ${
                  !alt.isRead
                    ? 'border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isCritical ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Info className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {alt.title}
                        </h3>
                        <Badge
                          size="sm"
                          variant={isCritical ? 'error' : isWarning ? 'warning' : 'info'}
                        >
                          {alt.severity}
                        </Badge>
                        {alt.appliance && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {alt.appliance.name}
                          </span>
                        )}
                        {!alt.isRead && (
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alt.message}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 font-mono">
                        <span>{new Date(alt.createdAt).toLocaleString()}</span>
                        {alt.metricValue && (
                          <span>
                            Measured: <strong>{alt.metricValue}</strong> (Threshold: {alt.thresholdValue})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0">
                    {!alt.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => markReadMutation.mutate(alt.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <button
                      onClick={() => dismissMutation.mutate(alt.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Humanistic Action Guidance Card */}
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      What happened & How to resolve:
                    </span>
                    {advice.canQuickFix && (
                      <button
                        onClick={() => quickEcoSceneMutation.mutate()}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Auto-Resolve with Eco-Saver <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>Why:</strong> {advice.reason}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Recommendation:</strong> {advice.action}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No alerts right now"
          description="Your electricity grid parameters, budgets, and connected appliances are operating within safe bounds."
        />
      )}
    </div>
  );
};

