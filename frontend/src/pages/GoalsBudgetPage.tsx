import React, { useState } from 'react';
import {
  Target,
  Sliders,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Leaf,
  Calendar,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Goal, Budget } from '../types/index.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import { useToast } from '../context/ToastContext.js';
import confetti from 'canvas-confetti';
import { Trash2, Award, Sparkles } from 'lucide-react';

export const GoalsBudgetPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);

  const [budgetAmount, setBudgetAmount] = useState(3500);
  const [alertThreshold, setAlertThreshold] = useState(85);

  const [newGoal, setNewGoal] = useState({
    title: 'Peak Reduction Target',
    goalType: 'MONTHLY_KWH',
    targetValue: 240,
    unit: 'kWh',
    endDate: '2026-10-31',
  });

  const { data, isLoading } = useQuery<{ goals: Goal[]; budget: Budget }>({
    queryKey: ['goals-budget'],
    queryFn: () => apiRequest('/goals'),
  });

  const updateBudgetMutation = useMutation({
    mutationFn: (updates: any) => apiRequest('/goals/budget', { method: 'PUT', body: JSON.stringify(updates) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-budget'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('Budget parameters updated successfully');
      setIsBudgetModalOpen(false);
    },
    onError: () => error('Failed to update budget'),
  });

  const createGoalMutation = useMutation({
    mutationFn: (goalData: any) => apiRequest('/goals', { method: 'POST', body: JSON.stringify(goalData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-budget'] });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
      success('Energy goal created successfully');
      setIsCreateGoalModalOpen(false);
    },
    onError: () => error('Failed to create goal'),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-budget'] });
      success('Goal deleted');
    },
    onError: () => error('Failed to delete goal'),
  });

  const markAchievedMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'ACHIEVED' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-budget'] });
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
      success('Outstanding! Milestone marked as Achieved! 🏆');
    },
    onError: () => error('Failed to update goal status'),
  });


  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-44 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const { goals, budget } = data;

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudgetMutation.mutate({
      budgetAmount,
      alertThresholdPercent: alertThreshold,
    });
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate(newGoal);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Energy Budgets & Conservation Goals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set pacing limits, track monthly financial allowances, and monitor carbon reduction commitments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBudgetAmount(budget.budgetAmount || 3500);
              setAlertThreshold(budget.alertThresholdPercent || 85);
              setIsBudgetModalOpen(true);
            }}
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
          >
            Adjust Budget Limit
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateGoalModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Goal
          </Button>
        </div>
      </div>

      {/* Monthly Budget Tracker Card */}
      <Card className="p-6 sm:p-7 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Current Billing Cycle Budget
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                ₹{budget.currentSpent.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-slate-500">
                / ₹{budget.budgetAmount.toLocaleString()} Limit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              size="md"
              variant={budget.isOverThreshold ? 'warning' : 'success'}
              dot={true}
            >
              {budget.isOverThreshold ? 'Threshold Reached (>85%)' : 'Pacing On Track'}
            </Badge>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">{budget.spentPercent}% Expended</span>
            <span className="text-slate-500 font-mono">{budget.remainingDays} days remaining in cycle</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budget.isOverThreshold ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budget.spentPercent || 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Projected Month-End: ₹{budget.projectedSpent.toLocaleString()}</span>
            <span>Alert Trigger: {budget.alertThresholdPercent}% of cap</span>
          </div>
        </div>
      </Card>

      {/* Humanistic Motivation Badges Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl border border-amber-500/20 flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Eco Champion</h4>
            <p className="text-[11px] text-slate-500">18.5% Carbon reduction attained</p>
          </div>
        </div>
        <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl border border-emerald-500/20 flex items-center gap-3">
          <span className="text-2xl">☀️</span>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Solar Native</h4>
            <p className="text-[11px] text-slate-500">64.2% Direct solar self-consumption</p>
          </div>
        </div>
        <div className="p-3.5 bg-gradient-to-r from-blue-500/10 to-transparent rounded-xl border border-blue-500/20 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Peak Guardian</h4>
            <p className="text-[11px] text-slate-500">Zero surcharge penalties this cycle</p>
          </div>
        </div>
      </div>

      {/* Energy Goals List */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Active Sustainability Goals
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <Card key={g.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{g.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      size="sm"
                      variant={
                        g.status === 'ACHIEVED'
                          ? 'success'
                          : g.status === 'ON_TRACK'
                          ? 'success'
                          : g.status === 'AT_RISK'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {g.status.replace('_', ' ')}
                    </Badge>

                    <button
                      onClick={() => deleteGoalMutation.mutate(g.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {g.currentValue}
                  </span>
                  <span className="text-xs text-slate-500">
                    / {g.targetValue} {g.unit}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        g.status === 'ACHIEVED'
                          ? 'bg-emerald-500'
                          : g.status === 'ON_TRACK'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, g.percentage || 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                    <span>{g.percentage}% Progress</span>
                    <span>Target Date: {new Date(g.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {g.status !== 'ACHIEVED' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAchievedMutation.mutate(g.id)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    Mark Goal Achieved
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>


      {/* Adjust Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Adjust Monthly Energy Budget"
        subtitle="Set currency expenditure limit and alert threshold"
      >
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Monthly Budget Cap (₹)
            </label>
            <input
              type="number"
              min="500"
              max="100000"
              step="100"
              required
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(parseInt(e.target.value, 10) || 3500)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Alert Trigger Threshold (% of budget)
            </label>
            <input
              type="number"
              min="50"
              max="99"
              required
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value, 10) || 85)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Sends an instant notification when monthly spend crosses {alertThreshold}%.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={updateBudgetMutation.isPending}>
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create New Goal Modal */}
      <Modal
        isOpen={isCreateGoalModalOpen}
        onClose={() => setIsCreateGoalModalOpen(false)}
        title="Create Energy Conservation Goal"
        subtitle="Set a measurable milestone for consumption or carbon abatement"
      >
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Goal Title
            </label>
            <input
              type="text"
              required
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Goal Type
              </label>
              <select
                value={newGoal.goalType}
                onChange={(e) =>
                  setNewGoal({
                    ...newGoal,
                    goalType: e.target.value,
                    unit: e.target.value === 'MONTHLY_KWH' ? 'kWh' : e.target.value === 'MONTHLY_COST' ? 'INR' : '%',
                  })
                }
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MONTHLY_KWH">Monthly Usage Limit (kWh)</option>
                <option value="MONTHLY_COST">Monthly Spend Cap (₹)</option>
                <option value="CARBON_REDUCTION">Carbon Reduction (%)</option>
                <option value="SOLAR_SELF_CONSUMPTION">Solar Self-Consumption (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Value ({newGoal.unit})
              </label>
              <input
                type="number"
                required
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              required
              value={newGoal.endDate}
              onChange={(e) => setNewGoal({ ...newGoal, endDate: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createGoalMutation.isPending}>
              Create Goal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
