import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  Power,
  Clock,
  Home,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Appliance, ApplianceCategory } from '../types/index.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { useToast } from '../context/ToastContext.js';

export const ApplianceManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [deletingApplianceId, setDeletingApplianceId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    category: ApplianceCategory;
    powerRatingWatts: number;
    room: string;
    dailyAvgHours: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    scheduleOn?: string;
    scheduleOff?: string;
  }>({
    name: '',
    category: 'COOLING',
    powerRatingWatts: 1200,
    room: 'Living Room',
    dailyAvgHours: 4,
    priority: 'MEDIUM',
  });

  // 1. Fetch Appliances
  const { data: appliances, isLoading } = useQuery<Appliance[]>({
    queryKey: ['appliances', selectedCategory, searchQuery],
    queryFn: () =>
      apiRequest(
        `/appliances?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}`
      ),
  });

  // 2. Toggle Appliance State Mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isOn }: { id: string; isOn: boolean }) =>
      apiRequest(`/appliances/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isOn }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['live-power'] });
      success(`${data.name} turned ${data.isOn ? 'ON' : 'OFF'}`);
    },
    onError: () => error('Failed to toggle appliance'),
  });

  // Batch Scene Mutation
  const sceneMutation = useMutation({
    mutationFn: (scene: string) =>
      apiRequest('/appliances/scenes/activate', {
        method: 'POST',
        body: JSON.stringify({ scene }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['live-power'] });
      success(data?.message || 'Smart scene preset activated!');
    },
    onError: () => error('Failed to activate scene'),
  });

  // 3. Create Appliance Mutation
  const createMutation = useMutation({
    mutationFn: (newApp: any) =>
      apiRequest('/appliances', {
        method: 'POST',
        body: JSON.stringify(newApp),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('Appliance added successfully');
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => error(err.message || 'Failed to add appliance'),
  });

  // 4. Update Appliance Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiRequest(`/appliances/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('Appliance updated successfully');
      setEditingAppliance(null);
      resetForm();
    },
    onError: (err: any) => error(err.message || 'Failed to update appliance'),
  });

  // 5. Delete Appliance Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/appliances/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('Appliance deleted successfully');
      setDeletingApplianceId(null);
    },
    onError: () => error('Failed to delete appliance'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'COOLING',
      powerRatingWatts: 1200,
      room: 'Living Room',
      dailyAvgHours: 4,
      priority: 'MEDIUM',
    });
  };

  const handleOpenEdit = (app: Appliance) => {
    setEditingAppliance(app);
    setFormData({
      name: app.name,
      category: app.category,
      powerRatingWatts: app.powerRatingWatts,
      room: app.room,
      dailyAvgHours: app.dailyAvgHours,
      priority: app.priority,
      scheduleOn: app.scheduleOn || undefined,
      scheduleOff: app.scheduleOff || undefined,
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAppliance) {
      updateMutation.mutate({ id: editingAppliance.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categories: Array<{ key: string; label: string }> = [
    { key: 'ALL', label: 'All Appliances' },
    { key: 'COOLING', label: 'Cooling' },
    { key: 'HEATING', label: 'Heating' },
    { key: 'KITCHEN', label: 'Kitchen' },
    { key: 'LIGHTING', label: 'Lighting' },
    { key: 'ELECTRONICS', label: 'Electronics' },
    { key: 'APPLIANCES', label: 'Appliances' },
  ];

  // Dynamic Room List from current appliances
  const allRooms = [
    'ALL',
    ...Array.from(new Set((appliances || []).map((a) => a.room).filter(Boolean))),
  ];

  const runningAppliances = (appliances || []).filter((a) => a.isOn);
  const totalActiveWatts = runningAppliances.reduce((sum, a) => sum + (a.powerRatingWatts || 0), 0);
  const currentHourlyBurnRate = ((totalActiveWatts / 1000) * 8.5).toFixed(2);

  // Filter appliances by selected Room in addition to backend category
  const filteredAppliances = (appliances || []).filter((app) => {
    if (selectedRoom === 'ALL') return true;
    return app.room?.toLowerCase() === selectedRoom.toLowerCase();
  });

  const getCategoryTip = (cat: string) => {
    switch (cat) {
      case 'COOLING':
        return 'Keeping AC at 24°C instead of 18°C saves ~₹240/week with zero comfort sacrifice.';
      case 'HEATING':
        return 'Setting a 20-min auto timer on geysers prevents continuous standby water reheating.';
      case 'KITCHEN':
        return 'Defrosting frozen food in the fridge compartment cuts induction and microwave run times.';
      case 'ELECTRONICS':
        return 'Using smart socket strips eliminates ~₹65/mo in passive ghost/vampire standby power.';
      case 'APPLIANCES':
        return 'Running full wash loads on cold/eco cycle (30°C) cuts electricity usage by up to 40%.';
      default:
        return 'Powering during solar peak (11 AM - 3 PM) runs this appliance entirely on free solar sunlight.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Appliance Management & Disaggregation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor, toggle, and configure smart energy ratings across all connected household circuits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Appliance
          </Button>
        </div>
      </div>

      {/* Household Circuit Telemetry & Quick Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Live Active Load</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {(totalActiveWatts / 1000).toFixed(2)} kW
            </span>
            <span className="text-xs text-slate-500 font-mono">({totalActiveWatts} W)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {runningAppliances.length} of {appliances?.length || 0} appliances currently drawing power
          </p>
        </Card>

        <Card className="p-4 border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Estimated Run Rate</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              ₹{currentHourlyBurnRate}
            </span>
            <span className="text-xs text-slate-500">/ hour</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            At current average electricity tariff of ₹8.50/kWh
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">One-Touch Controls</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={() => sceneMutation.mutate('ECO_SAVER')}
              isLoading={sceneMutation.isPending}
            >
              Eco-Saver
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              onClick={() => sceneMutation.mutate('ALL_OFF')}
              isLoading={sceneMutation.isPending}
            >
              All Off
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1"
              onClick={() => sceneMutation.mutate('ALL_ON')}
              isLoading={sceneMutation.isPending}
            >
              All On
            </Button>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Pill Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute inset-y-0 left-2.5 my-auto text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search appliance by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Room Filter Pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-semibold uppercase text-[10px] pr-1">Rooms:</span>
          {allRooms.map((room) => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedRoom === room
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {room === 'ALL' ? 'All Rooms' : room}
            </button>
          ))}
        </div>
      </div>

      {/* Appliance Cards Grid */}
      {filteredAppliances && filteredAppliances.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAppliances.map((app) => {
            const hourlyRate = ((app.powerRatingWatts / 1000) * 8.5).toFixed(2);

            return (
              <Card
                key={app.id}
                className={`p-5 flex flex-col justify-between transition-all ${
                  app.isOn
                    ? 'border-emerald-500/60 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-slate-200/60 dark:border-slate-800/80 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Badge size="sm" variant={app.isOn ? 'success' : 'neutral'} dot={true}>
                        {app.isOn ? 'RUNNING' : 'STANDBY'}
                      </Badge>
                      {app.isOn && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          ₹{hourlyRate}/hr
                        </span>
                      )}
                    </div>

                    {/* Top Action Icons: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(app)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Edit Appliance"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingApplianceId(app.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Appliance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {app.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    <span>{app.room} • {app.category}</span>
                  </p>

                  {/* Power & Usage Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Power Rating:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {app.powerRatingWatts >= 1000
                          ? `${(app.powerRatingWatts / 1000).toFixed(1)} kW`
                          : `${app.powerRatingWatts} W`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily Average:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {app.dailyAvgHours}h / day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Monthly:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{app.calculatedMonthlyCost || app.monthlyEstCost}/mo
                      </span>
                    </div>
                  </div>

                  {/* Humanistic Eco Tip Box */}
                  <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">💡 Eco Tip: </span>
                    {getCategoryTip(app.category)}
                  </div>
                </div>

                {/* Power Toggle Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant={app.isOn ? 'danger' : 'primary'}
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={() => toggleMutation.mutate({ id: app.id, isOn: !app.isOn })}
                    leftIcon={<Power className="w-3.5 h-3.5" />}
                  >
                    Turn {app.isOn ? 'OFF' : 'ON'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No appliances found"
          description={
            selectedRoom !== 'ALL'
              ? `No appliances registered in "${selectedRoom}". Try switching to "All Rooms" or add one below.`
              : 'Add your first appliance (AC, Geyser, Refrigerator, Induction) to start monitoring electrical loads.'
          }
          actionText="Add New Appliance"
          onAction={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        />
      )}

      {/* Add / Edit Appliance Modal */}
      <Modal
        isOpen={isAddModalOpen || editingAppliance !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAppliance(null);
        }}
        title={editingAppliance ? 'Edit Appliance Settings' : 'Add New Connected Appliance'}
        subtitle="Configure power rating, daily usage hours, and category"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Appliance Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="E.g. Inverter Split AC (1.5 Ton)"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ApplianceCategory })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="COOLING">Cooling (AC, Cooler)</option>
                <option value="HEATING">Heating (Geyser, Heater)</option>
                <option value="KITCHEN">Kitchen (Fridge, Induction)</option>
                <option value="LIGHTING">Lighting</option>
                <option value="ELECTRONICS">Electronics (PC, TV)</option>
                <option value="APPLIANCES">Appliances (Washing Machine)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Power Rating (Watts)
              </label>
              <input
                type="number"
                required
                min="10"
                max="10000"
                value={formData.powerRatingWatts}
                onChange={(e) => setFormData({ ...formData, powerRatingWatts: parseInt(e.target.value, 10) || 1000 })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Room Location
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="E.g. Master Bedroom"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Daily Avg Usage (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="24"
                value={formData.dailyAvgHours}
                onChange={(e) => setFormData({ ...formData, dailyAvgHours: parseFloat(e.target.value) || 4 })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingAppliance(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingAppliance ? 'Save Changes' : 'Add Appliance'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingApplianceId !== null}
        onClose={() => setDeletingApplianceId(null)}
        title="Delete Appliance"
        subtitle="Are you sure you want to remove this appliance?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Removing this appliance will dissociate historical telemetry and recommendations for this device.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setDeletingApplianceId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deletingApplianceId && deleteMutation.mutate(deletingApplianceId)}
              isLoading={deleteMutation.isPending}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
