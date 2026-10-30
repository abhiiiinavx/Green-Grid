import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { apiRequest } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'csv') {
        const csvData = await apiRequest('/reports/export?format=csv');
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `green-grid-audit-report-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        success('CSV Report downloaded successfully');
        onClose();
      } else {
        // PDF generation using jsPDF
        const report = await apiRequest('/reports/export?format=json');
        const doc = new jsPDF();

        // Header Banner
        doc.setFillColor(15, 56, 42); // Deep forest green #0F382A
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('GREEN GRID — Smart Energy Audit Report', 14, 18);
        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | User: ${report.reportMetadata.user || 'Demo User'}`, 14, 25);

        // Section: Summary KPIs
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(13);
        doc.text('1. Executive Energy Summary (Past 30 Days)', 14, 40);

        const kpisData = [
          ['Total Electricity Consumed', `${report.summary.totalConsumptionKwh} kWh`],
          ['Estimated Bill Charges', `INR ${report.summary.totalCost}`],
          ['Rooftop Solar Generated', `${report.summary.totalSolarKwh} kWh`],
          ['Carbon Emissions (Grid)', `${report.summary.totalCarbonEmissionsKg} kg CO2e`],
          ['Average Daily Consumption', `${report.summary.avgDailyKwh} kWh/day`],
        ];

        autoTable(doc, {
          startY: 44,
          head: [['Metric', 'Value']],
          body: kpisData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 9 },
        });

        // Section: Top Recommendations
        const finalY = (doc as any).lastAutoTable?.finalY || 95;
        doc.text('2. High-Impact Energy Saving Actions', 14, finalY + 12);

        const recsTable = report.recommendations.slice(0, 4).map((r: any) => [
          r.title,
          r.impactLevel,
          `INR ${r.potentialMonthlySavingsCost}/mo`,
          `${r.potentialMonthlySavingsKwh} kWh/mo`,
        ]);

        autoTable(doc, {
          startY: finalY + 16,
          head: [['Recommendation', 'Impact', 'Est. Monthly Savings', 'Saved Energy']],
          body: recsTable,
          theme: 'grid',
          headStyles: { fillColor: [5, 150, 105] },
          styles: { fontSize: 8 },
        });

        // Section: Daily Log Sample
        const secondY = (doc as any).lastAutoTable?.finalY || 160;
        doc.text('3. Daily Telemetry Log Sample', 14, secondY + 12);

        const logSample = report.records.slice(0, 8).map((r: any) => [
          r.date,
          `${r.totalKwh} kWh`,
          `INR ${r.cost}`,
          `${r.solarKwh} kWh`,
          `${r.gridKwh} kWh`,
          `${r.carbonKg} kg`,
        ]);

        autoTable(doc, {
          startY: secondY + 16,
          head: [['Date', 'Total kWh', 'Cost', 'Solar kWh', 'Grid Draw', 'Carbon CO2']],
          body: logSample,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] },
          styles: { fontSize: 8 },
        });

        // Footer Note
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Green Grid Smart Energy Management Platform • Confidential Audit Document', 14, 285);

        doc.save(`green-grid-audit-report-${Date.now()}.pdf`);
        success('PDF Audit Report downloaded successfully');
        onClose();
      }
    } catch (err: any) {
      error(err.message || 'Failed to generate report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Energy Audit Report" subtitle="Download comprehensive analytics & savings breakdown">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Select your desired format to generate a full energy audit including 30-day consumption trends, appliance-wise breakdowns, tariff calculations, and AI recommendations.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Option: PDF */}
          <div
            onClick={() => setSelectedFormat('pdf')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${
              selectedFormat === 'pdf'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <span className="font-semibold text-xs">PDF Document</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Formatted Audit with Tables & Graphs
            </span>
          </div>

          {/* Option: CSV */}
          <div
            onClick={() => setSelectedFormat('csv')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${
              selectedFormat === 'csv'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-2">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="font-semibold text-xs">CSV Spreadsheet</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Raw Historical Telemetry Dataset
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>Includes carbon emission offset indices and slab tariff breakdowns.</span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleExport} isLoading={isExporting} leftIcon={<Download className="w-4 h-4" />}>
            Download {selectedFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
