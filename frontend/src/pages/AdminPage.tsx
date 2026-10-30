import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Zap,
  Activity,
  Server,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/SkeletonLoader.js';
import { useToast } from '../context/ToastContext.js';

export const AdminPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // 1. Fetch Admin Overview
  const { data: adminData, isLoading: isAdminLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiRequest('/admin/overview'),
  });

  // 2. Fetch User Directory
  const { data: usersList, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users', searchQuery, roleFilter],
    queryFn: () => apiRequest(`/admin/users?search=${encodeURIComponent(searchQuery)}&role=${roleFilter}`),
  });

  // Toggle user status mutation
  const toggleUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest(`/admin/users/${userId}/toggle-status`, { method: 'POST' }),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      success(`User ${updatedUser.name} status updated to ${updatedUser.isActive ? 'Active' : 'Disabled'}`);
    },
    onError: () => error('Failed to update user status'),
  });

  if (isAdminLoading || !adminData) {
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

  const { metrics, recentUsers, recentAuditLogs } = adminData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Administration & Grid Operations
            </h1>
            <Badge variant="error" size="sm">
              ADMIN PRIVILEGES
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Platform-wide telemetry aggregates, tenant management, and security audit trails
          </p>
        </div>
      </div>

      {/* 4 System Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Registered Tenants</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {metrics.totalUsers} <span className="text-xs font-normal text-slate-500">Accounts</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            {metrics.activeUsers} Active Metering Nodes
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Energy Monitored</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {metrics.totalEnergyMonitoredMwh} <span className="text-xs font-normal text-slate-500">MWh</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Aggregate Invoiced: ₹{metrics.totalCostMonitored.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Solar Clean Generation</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 mt-1.5">
            {metrics.totalSolarGeneratedMwh} <span className="text-xs font-normal text-slate-500">MWh</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Offset: {metrics.totalCarbonAbatedTonnes} Tonnes CO₂e
          </p>
        </Card>

        <Card className="p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">System Health</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {metrics.systemHealth.uptimePercent}%
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            API & AI Pipelines Operational
          </p>
        </Card>
      </div>

      {/* User Directory Management */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tenant Directory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect user profiles, connected appliance counts, and access statuses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Type / Location</th>
                <th className="py-2.5 px-3">Appliances</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList && usersList.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                    <p className="text-slate-500 text-[11px]">{u.email}</p>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={u.role === 'ADMIN' ? 'error' : 'neutral'} size="sm">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {u.profile?.userType || 'HOME'} • {u.profile?.location || 'Bengaluru'}
                  </td>
                  <td className="py-3 px-3 font-mono">{u._count?.appliances || 0} devices</td>
                  <td className="py-3 px-3">
                    <Badge variant={u.isActive ? 'success' : 'neutral'} dot={true} size="sm">
                      {u.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant={u.isActive ? 'danger' : 'primary'}
                      size="sm"
                      className="text-xs py-1 px-2.5"
                      onClick={() => toggleUserMutation.mutate(u.id)}
                    >
                      {u.isActive ? 'Disable' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Security Audit Trail */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Recent Security Audit Logs"
          subtitle="Chronological trail of administrative actions, logins, and profile modifications"
        />
        <div className="space-y-2 mt-2">
          {recentAuditLogs.map((log: any) => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{log.action}</span>
                <span className="text-slate-400">by {log.user?.email || 'System'}</span>
              </div>
              <span className="text-slate-500 text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
