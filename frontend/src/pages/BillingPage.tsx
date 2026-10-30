import React, { useState } from 'react';
import {
  Receipt,
  Sliders,
  DollarSign,
  TrendingDown,
  Layers,
  Settings,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import { useToast } from '../context/ToastContext.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const BillingPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);


  // Interactive Simulator Slider State
  const [reducedHours, setReducedHours] = useState(1.5);
  const [percentAdjustment, setPercentAdjustment] = useState(-10);

  // 1. Fetch Billing Overview
  const { data: billing, isLoading } = useQuery({
    queryKey: ['billing-overview'],
    queryFn: () => apiRequest('/billing'),
  });

  // 2. Fetch Simulation Data
  const { data: simulationData } = useQuery({
    queryKey: ['bill-simulation', reducedHours, percentAdjustment],
    queryFn: () =>
      apiRequest('/billing/simulate', {
        method: 'POST',
        body: JSON.stringify({
          hoursReducedPerDay: reducedHours,
          kwhAdjustmentPercent: percentAdjustment,
        }),
      }),
  });

  // 3. Update Tariff Mutation
  const updateTariffMutation = useMutation({
    mutationFn: (updatedTariff: any) =>
      apiRequest('/billing/tariff', {
        method: 'PUT',
        body: JSON.stringify(updatedTariff),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('Tariff structure updated successfully');
      setIsTariffModalOpen(false);
    },
    onError: () => error('Failed to update tariff'),
  });

  const [tariffForm, setTariffForm] = useState({
    name: 'BESCOM Domestic LT-2(a) Slab Tariff',
    type: 'SLAB',
    baseRatePerKwh: 6.5,
    fixedMonthlyCharge: 140,
    taxPercent: 9,
    slab1Limit: 100,
    slab1Rate: 4.75,
    slab2Limit: 300,
    slab2Rate: 6.5,
    slab3Rate: 8.25,
  });

  if (isLoading || !billing) {
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

  const { currentUsage, projection, historicalBills, tariff } = billing;

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    updateTariffMutation.mutate(tariffForm);
  };

  const handleDownloadStatement = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 56, 42);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('GREEN GRID — Monthly Electricity Statement', 14, 18);
      doc.setFontSize(9);
      doc.text(`Billing Cycle: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} | Tariff: ${tariff.name}`, 14, 26);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.text('1. Charges & Energy Assessment', 14, 44);

      const billTable = [
        ['Units Consumed (Month-to-Date)', `${currentUsage.totalMonthKwh} kWh`],
        ['Energy Consumption Charges', `INR ${currentUsage.energyCharges}`],
        ['Fixed Monthly Meter Charges', `INR ${currentUsage.fixedCharges}`],
        ['Electricity Duty / Tax', `INR ${currentUsage.taxCharges}`],
        ['Total Net Amount Accrued', `INR ${currentUsage.currentBillAmount}`],
        ['Projected Month-End Total', `INR ${projection.projectedBillAmount}`],
      ];

      autoTable(doc, {
        startY: 48,
        head: [['Invoice Component', 'Amount']],
        body: billTable,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.text('2. Slab Tier Allocation', 14, finalY + 12);

      const slabTable = currentUsage.breakdown.map((b: any) => [
        b.slab,
        b.rate,
        b.units,
        b.cost,
      ]);

      autoTable(doc, {
        startY: finalY + 16,
        head: [['Slab Tier', 'Rate (INR/kWh)', 'Units Billed', 'Amount (INR)']],
        body: slabTable,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8 },
      });

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Green Grid Technologies • Certified Digital Electricity Audit Document', 14, 285);

      doc.save(`green-grid-statement-${Date.now()}.pdf`);
      success('Electricity Statement (PDF) downloaded successfully');
    } catch (err) {
      error('Failed to generate PDF statement');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const slab1Limit = tariff.slab1Limit || 100;
  const slab2Limit = tariff.slab2Limit || 300;
  const unitsUsed = currentUsage.totalMonthKwh;
  const slab2Remaining = Math.max(0, slab2Limit - unitsUsed);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Electricity Bill & Tariff Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Slab-based tiered charges, Time-of-Use rates, month-end projections, and interactive what-if modeling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadStatement}
            disabled={isGeneratingPdf}
            leftIcon={<Download className="w-3.5 h-3.5 text-emerald-500" />}
          >
            {isGeneratingPdf ? 'Generating...' : 'Download Statement (PDF)'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTariffForm({
                name: tariff.name || 'Standard Slab Tariff',
                type: tariff.type || 'SLAB',
                baseRatePerKwh: tariff.baseRatePerKwh || 6.5,
                fixedMonthlyCharge: tariff.fixedMonthlyCharge || 140,
                taxPercent: tariff.taxPercent || 9,
                slab1Limit: tariff.slab1Limit || 100,
                slab1Rate: tariff.slab1Rate || 4.75,
                slab2Limit: tariff.slab2Limit || 300,
                slab2Rate: tariff.slab2Rate || 6.5,
                slab3Rate: tariff.slab3Rate || 8.25,
              });
              setIsTariffModalOpen(true);
            }}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
          >
            Configure Tariff
          </Button>
        </div>
      </div>

      {/* Humanistic Slab Threshold Buffer Bar */}
      <Card className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📊</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Slab 2 Safety Buffer: {slab2Remaining.toFixed(1)} kWh remaining
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                You have used {unitsUsed} kWh. Staying under {slab2Limit} kWh saves you from the steep ₹{tariff.slab3Rate || 8.25}/kWh Slab 3 rate!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, (unitsUsed / slab2Limit) * 100)}%` }}
              />
            </div>
            <span className="font-mono font-semibold text-[11px] text-emerald-700 dark:text-emerald-400">
              {Math.round((unitsUsed / slab2Limit) * 100)}%
            </span>
          </div>
        </div>
      </Card>


      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-emerald-500/30">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Accrued Month Bill</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            ₹{currentUsage.currentBillAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Energy: ₹{currentUsage.energyCharges} + Fixed: ₹{currentUsage.fixedCharges}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Projected Month-End</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            ₹{projection.projectedBillAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            Target Budget: ₹{projection.budgetLimit} ({projection.isOverBudget ? '⚠️ Caution' : '✓ On Track'})
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Month Units Consumed</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {currentUsage.totalMonthKwh} <span className="text-xs font-normal text-slate-500">kWh</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Daily Average: {currentUsage.dailyAverageKwh} kWh/day
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Effective Tariff Rate</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            ₹{currentUsage.effectiveRatePerKwh} <span className="text-xs font-normal text-slate-500">/ kWh</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Structure: {tariff.type} Domestic LT
          </p>
        </Card>
      </div>

      {/* Row: Slab Breakdown Visualizer & Interactive Bill Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slab Progression Visualizer */}
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Multi-Tier Slab Breakdown"
            subtitle="Units consumed within progressive electricity tariff slabs"
          />
          <div className="space-y-4 mt-2">
            {currentUsage.slabBreakdown && currentUsage.slabBreakdown.map((slab: any) => (
              <div key={slab.slab} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{slab.slab}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ₹{slab.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{slab.units.toFixed(1)} kWh consumed</span>
                  <span>Rate: ₹{slab.rate.toFixed(2)} / unit</span>
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Fixed Demand Charges: <strong>₹{currentUsage.fixedCharges}</strong></span>
              <span>Electricity Duty (Tax): <strong>₹{currentUsage.taxAmount}</strong></span>
            </div>
          </div>
        </Card>

        {/* Interactive "What-If" Bill Reduction Simulator */}
        <Card className="p-5 sm:p-6 bg-slate-900 text-white border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Interactive "What-If" Bill Simulator
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded">
              SIMULATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Test how minor behavioral changes (e.g. optimizing AC hours) immediately reduce month-end billing.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Reduce High-Power Appliance (AC / Geyser) Usage:</span>
                <span className="font-mono text-emerald-400 font-bold">{reducedHours}h / day</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="0.5"
                value={reducedHours}
                onChange={(e) => setReducedHours(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {simulationData && (
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Baseline Projected Bill:</span>
                  <span className="text-xs font-mono font-semibold text-slate-300">₹{simulationData.baselineBill}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Optimized Projected Bill:</span>
                  <span className="text-sm font-mono font-bold text-white">₹{simulationData.simulatedBill}</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-semibold">Immediate Estimated Monthly Savings:</span>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    ₹{simulationData.savings} / mo
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Historical Monthly Bills Chart */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Historical Billing Comparison"
          subtitle="Monthly electricity billing amounts and total units consumed"
        />
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalBills || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Bar dataKey="totalBill" name="Bill Amount (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kwh" name="Consumed (kWh)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tariff Configuration Modal */}
      <Modal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
        title="Configure Electricity Tariff"
        subtitle="Set slab thresholds, base rates, fixed charges, and tax"
      >
        <form onSubmit={handleSaveTariff} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tariff Plan Name
            </label>
            <input
              type="text"
              required
              value={tariffForm.name}
              onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fixed Monthly Charge (₹)
              </label>
              <input
                type="number"
                value={tariffForm.fixedMonthlyCharge}
                onChange={(e) => setTariffForm({ ...tariffForm, fixedMonthlyCharge: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tax / Duty (%)
              </label>
              <input
                type="number"
                value={tariffForm.taxPercent}
                onChange={(e) => setTariffForm({ ...tariffForm, taxPercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Slab Tiers (INR / kWh)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500">0 - 100 kWh</label>
                <input
                  type="number"
                  step="0.1"
                  value={tariffForm.slab1Rate}
                  onChange={(e) => setTariffForm({ ...tariffForm, slab1Rate: parseFloat(e.target.value) || 4.75 })}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">101 - 300 kWh</label>
                <input
                  type="number"
                  step="0.1"
                  value={tariffForm.slab2Rate}
                  onChange={(e) => setTariffForm({ ...tariffForm, slab2Rate: parseFloat(e.target.value) || 6.50 })}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">&gt; 300 kWh</label>
                <input
                  type="number"
                  step="0.1"
                  value={tariffForm.slab3Rate}
                  onChange={(e) => setTariffForm({ ...tariffForm, slab3Rate: parseFloat(e.target.value) || 8.25 })}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsTariffModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={updateTariffMutation.isPending}>
              Save Tariff
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
