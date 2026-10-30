import React from 'react';
import {
  Lightbulb,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  Zap,
  Leaf,
  Sliders,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Recommendation } from '../types/index.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import { useToast } from '../context/ToastContext.js';
import confetti from 'canvas-confetti';

export const RecommendationsPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => apiRequest('/recommendations'),
  });

  const applyMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/recommendations/${id}/apply`, { method: 'POST' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });

      success(res.message || 'Optimization applied! Monthly savings started immediately.');
    },
    onError: () => error('Failed to apply recommendation'),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/recommendations/${id}/dismiss`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      success('Recommendation dismissed');
    },
    onError: () => error('Failed to dismiss recommendation'),
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest('/recommendations/refresh', { method: 'POST' }),
    onSuccess: (recs) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success(`Home scanned! ${recs.length} intelligent energy tips prepared.`);
    },
    onError: () => error('Failed to re-scan recommendations'),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    );
  }


  const { summary, categorized } = data;

  const renderRecommendationSection = (
    title: string,
    subtitle: string,
    badgeVariant: 'error' | 'warning' | 'success',
    items: Recommendation[]
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          <Badge variant={badgeVariant} size="sm">
            {items.length} Actions
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {items.map((rec) => (
            <Card
              key={rec.id}
              className={`p-5 flex flex-col justify-between transition-all ${
                rec.isApplied
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {rec.title}
                  </span>
                  <Badge variant={badgeVariant} size="sm">
                    ₹{rec.potentialMonthlySavingsCost}/mo
                  </Badge>
                </div>

                {/* Problem */}
                <div className="space-y-2 text-xs mt-3">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Problem Observed:</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{rec.problem}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Why It Matters:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{rec.whyItMatters}</p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Suggested Optimization:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed font-medium">
                      {rec.suggestedAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Savings Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Saves ~{rec.potentialMonthlySavingsKwh} kWh / month
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dismissMutation.mutate(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                    title="Dismiss recommendation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {rec.isApplied ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Applied
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => applyMutation.mutate(rec.id)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Apply Action
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Actionable Energy-Saving Recommendations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personalized, human-scale optimizations computed from your real appliance inventory and tariff rates
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />}
        >
          {refreshMutation.isPending ? 'Analyzing Home Telemetry...' : 'Run AI Energy Scan'}
        </Button>
      </div>

      {/* Savings Summary Banner */}
      <Card className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-emerald-800/80 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingDown className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                Total Unlocked Potential Savings
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
                ₹{summary.totalPotentialSavingsCost.toLocaleString()} <span className="text-sm font-normal text-emerald-300">/ month</span>
              </p>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                <span>⚡ ~{summary.totalPotentialSavingsKwh} kWh/mo</span>
                <span>•</span>
                <span>🌱 ~{(summary.totalPotentialSavingsKwh * 0.82).toFixed(1)} kg CO₂ abated</span>
                <span>•</span>
                <span className="text-amber-300 font-medium">☕ Equivalent to ~{Math.round(summary.totalPotentialSavingsCost / 120)} cafe coffees</span>
              </p>
            </div>
          </div>


          <div className="flex items-center gap-2">
            <Badge variant="success" size="md">
              {summary.totalRecommendations} Available Recommendations
            </Badge>
          </div>
        </div>
      </Card>

      {/* 1. High Impact Section */}
      {renderRecommendationSection(
        'High Impact Recommendations',
        'Significant monthly bill reductions (> ₹200/mo) through schedule shifts and thermostat calibration',
        'error',
        categorized.highImpact
      )}

      {/* 2. Medium Impact Section */}
      {renderRecommendationSection(
        'Medium Impact Recommendations',
        'Mitigate standby vampire loads and prevent unnecessary cyclic reheating',
        'warning',
        categorized.mediumImpact
      )}

      {/* 3. Quick Wins Section */}
      {renderRecommendationSection(
        'Quick Wins',
        'Zero-cost maintenance actions with immediate payback (coil cleaning, batch cycles)',
        'success',
        categorized.quickWins
      )}
    </div>
  );
};
