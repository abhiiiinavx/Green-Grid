import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  Shield,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiRequest('/users/profile'),
  });

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || 'Bengaluru, India');
  const [userType, setUserType] = useState(profile?.userType || 'HOME');
  const [monthlyBudget, setMonthlyBudget] = useState(profile?.monthlyBudget || 3500);
  const [energyGoalKwh, setEnergyGoalKwh] = useState(profile?.energyGoalKwh || 250);

  // Sync state once profile loads
  React.useEffect(() => {
    if (profile) {
      setName(profile.user?.name || user?.name || '');
      setPhone(profile.phone || '');
      setLocation(profile.location || 'Bengaluru, India');
      setUserType(profile.userType || 'HOME');
      setMonthlyBudget(profile.monthlyBudget || 3500);
      setEnergyGoalKwh(profile.energyGoalKwh || 250);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (updatedData: any) =>
      apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      }),
    onSuccess: (res) => {
      updateUser({ name, profile: res });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      success('Profile updated successfully');
    },
    onError: () => error('Failed to update profile'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name,
      phone,
      location,
      userType,
      monthlyBudget,
      energyGoalKwh,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Settings & Profile Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your property location, building categorization, and billing parameters
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Avatar & Role Banner */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              {name.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h2>
                <Badge variant={user?.role === 'ADMIN' ? 'error' : 'success'} size="sm">
                  {user?.role || 'USER'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Property Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bengaluru, Karnataka"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Property Categorization
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="HOME">Home / Residential Apartment</option>
                <option value="HOSTEL">Hostel / PG Facility</option>
                <option value="OFFICE">Commercial Office</option>
                <option value="SMALL_BUSINESS">Small Business / Retail</option>
                <option value="CAMPUS">Campus / Institution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Target Budget (₹)
              </label>
              <input
                type="number"
                min="500"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 3500)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Consumption Target (kWh)
              </label>
              <input
                type="number"
                min="50"
                value={energyGoalKwh}
                onChange={(e) => setEnergyGoalKwh(parseFloat(e.target.value) || 250)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={updateProfileMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
