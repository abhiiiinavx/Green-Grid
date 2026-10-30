import React, { useState } from 'react';
import {
  Leaf,
  Moon,
  Shield,
  Film,
  LogOut,
  Power,
  Sparkles,
  Check,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import confetti from 'canvas-confetti';

interface SmartScenesBarProps {
  className?: string;
}

export const SmartScenesBar: React.FC<SmartScenesBarProps> = ({ className = '' }) => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const scenes = [
    {
      id: 'ECO_SAVER',
      name: 'Eco Saver',
      description: 'Cuts standby & idle loads',
      icon: <Leaf className="w-4 h-4 text-emerald-500" />,
      color: 'hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
      activeColor: 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
    },
    {
      id: 'PEAK_SHIELD',
      name: 'Peak Shield',
      description: 'Avoids expensive peak slab',
      icon: <Shield className="w-4 h-4 text-amber-500" />,
      color: 'hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
      activeColor: 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    },
    {
      id: 'GOOD_NIGHT',
      name: 'Good Night',
      description: 'Cool bedroom, rest of house off',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      color: 'hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20',
      activeColor: 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200',
    },
    {
      id: 'MOVIE_TIME',
      name: 'Movie Night',
      description: 'Cozy living room climate',
      icon: <Film className="w-4 h-4 text-purple-400" />,
      color: 'hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20',
      activeColor: 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200',
    },
    {
      id: 'AWAY_MODE',
      name: 'Away / Vacant',
      description: 'Only refrigerator active',
      icon: <LogOut className="w-4 h-4 text-rose-400" />,
      color: 'hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20',
      activeColor: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
    },
  ];

  const sceneMutation = useMutation({
    mutationFn: (sceneId: string) =>
      apiRequest('/appliances/scenes/activate', {
        method: 'POST',
        body: JSON.stringify({ scene: sceneId }),
      }),
    onSuccess: (data, sceneId) => {
      setActiveScene(sceneId);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['live-reading'] });
      queryClient.invalidateQueries({ queryKey: ['recent-readings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Trigger light confetti for eco and peak shield
      if (sceneId === 'ECO_SAVER' || sceneId === 'PEAK_SHIELD') {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      success(data.description || `Scene activated!`);
    },
    onError: () => {
      error('Failed to activate scene');
    },
  });

  return (
    <div className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Smart Living Presets
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              One-touch household energy scenes tailored to your daily routine
            </p>
          </div>
        </div>

        {activeScene && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <Check className="w-3 h-3" /> Active: {scenes.find((s) => s.id === activeScene)?.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {scenes.map((scene) => {
          const isActive = activeScene === scene.id;
          return (
            <button
              key={scene.id}
              onClick={() => sceneMutation.mutate(scene.id)}
              disabled={sceneMutation.isPending}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group ${
                isActive
                  ? `${scene.activeColor} shadow-xs ring-1 ring-emerald-500/30`
                  : `border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 ${scene.color}`
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="p-1 rounded-md bg-white dark:bg-slate-800 shadow-2xs">
                  {scene.icon}
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              <div>
                <span className="font-semibold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {scene.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {scene.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
