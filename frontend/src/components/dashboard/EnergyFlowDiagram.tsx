import React from 'react';
import { Sun, BatteryCharging, Home, Zap, ArrowRight, ArrowDown } from 'lucide-react';
import { Card } from '../common/Card.js';

interface EnergyFlowProps {
  solarKw: number;
  homeLoadKw: number;
  batterySocPercent: number;
  batteryPowerKw: number;
  gridDrawKw: number;
  gridExportKw: number;
}

export const EnergyFlowDiagram: React.FC<EnergyFlowProps> = ({
  solarKw,
  homeLoadKw,
  batterySocPercent,
  batteryPowerKw,
  gridDrawKw,
  gridExportKw,
}) => {
  const isBatteryCharging = batteryPowerKw > 0;
  const isBatteryDischarging = batteryPowerKw < 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Real-Time Energy Flow
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dynamic distribution between Generation, Storage, Load & Grid
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
          BALANCED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative py-2">
        {/* Node 1: Solar */}
        <div className="flex flex-col items-center p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center relative group">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center mb-2 shadow-xs">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Solar Array
          </span>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            {solarKw.toFixed(2)} kW
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {solarKw > 0 ? 'Generating' : 'Standby / Night'}
          </span>
        </div>

        {/* Node 2: Battery Storage */}
        <div className="flex flex-col items-center p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center relative">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Battery ({batterySocPercent.toFixed(0)}%)
          </span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {Math.abs(batteryPowerKw).toFixed(2)} kW
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isBatteryCharging ? 'Charging' : isBatteryDischarging ? 'Discharging' : 'Idle'}
          </span>
        </div>

        {/* Node 3: Home Consumption Load */}
        <div className="flex flex-col items-center p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center relative">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Active Load
          </span>
          <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
            {homeLoadKw.toFixed(2)} kW
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Household Demand
          </span>
        </div>

        {/* Node 4: Grid Import / Export */}
        <div className="flex flex-col items-center p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center relative">
          <div className="w-10 h-10 rounded-full bg-slate-700 dark:bg-slate-600 text-white flex items-center justify-center mb-2 shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Utility Grid
          </span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
            {gridExportKw > 0 ? `+${gridExportKw.toFixed(2)}` : `-${gridDrawKw.toFixed(2)}`} kW
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {gridExportKw > 0 ? 'Exporting (Net Meter)' : 'Importing from Grid'}
          </span>
        </div>
      </div>
    </Card>
  );
};
