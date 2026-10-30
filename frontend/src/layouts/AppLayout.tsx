import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Zap,
  BarChart3,
  Receipt,
  Sparkles,
  Lightbulb,
  Sun,
  Target,
  Bell,
  ShieldAlert,
  Moon,
  SunMedium,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  FileText,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { NotificationItem } from '../types/index.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);

  // Fetch notifications
  const { data: notifData } = useQuery<{ notifications: NotificationItem[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications'),
    refetchInterval: 15000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('/notifications/all/read', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success('Notifications marked as read');
    },
  });

  const toggleSimulation = async () => {
    try {
      const nextState = !isSimulationRunning;
      await apiRequest('/energy/simulation/toggle', {
        method: 'POST',
        body: JSON.stringify({ running: nextState }),
      });
      setIsSimulationRunning(nextState);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['live-reading'] });
      success(`Telemetry simulation ${nextState ? 'resumed' : 'paused'}`);
    } catch (err) {
      error('Failed to toggle simulation');
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/monitoring', label: 'Energy Monitoring', icon: <Activity className="w-4 h-4" /> },
    { to: '/appliances', label: 'Appliances', icon: <Zap className="w-4 h-4" /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/billing', label: 'Electricity Bill', icon: <Receipt className="w-4 h-4" /> },
    { to: '/forecasts', label: 'AI Predictions', icon: <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> },
    { to: '/recommendations', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4 text-amber-500" /> },
    { to: '/renewable', label: 'Solar & Battery', icon: <Sun className="w-4 h-4 text-amber-400" /> },
    { to: '/goals', label: 'Goals & Budget', icon: <Target className="w-4 h-4" /> },
    { to: '/alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
  ];

  if (user?.role === 'ADMIN') {
    navLinks.push({
      to: '/admin',
      label: 'Admin Portal',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
    });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-shrink-0 z-30 sticky top-0 h-screen">
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                GREEN GRID
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide uppercase">
                Smart Energy OS
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Quick Actions in Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {user?.name || 'Demo User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.profile?.userType || 'Home'} • {user?.role || 'USER'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Mobile menu trigger + App title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {user?.profile?.location || 'Bengaluru, India'} •{' '}
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Simulation Status Indicator Pill */}
            <button
              onClick={toggleSimulation}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                isSimulationRunning
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80 hover:bg-emerald-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title={isSimulationRunning ? 'Click to pause simulation' : 'Click to start simulation'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSimulationRunning ? 'bg-emerald-500 animate-live-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isSimulationRunning ? 'LIVE SIMULATION' : 'SIMULATION PAUSED'}
              </span>
              {isSimulationRunning ? (
                <Pause className="w-3 h-3 ml-0.5" />
              ) : (
                <Play className="w-3 h-3 ml-0.5" />
              )}
            </button>

            {/* Notification Bell Drawer Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {(notifData?.unreadCount || 0) > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notification Popover Drawer */}
              {isNotifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-elevated z-40 p-4 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Notifications</span>
                        {(notifData?.unreadCount || 0) > 0 && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                            {notifData?.unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                      {notifData?.notifications && notifData.notifications.length > 0 ? (
                        notifData.notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`py-2.5 px-1 flex flex-col gap-0.5 text-xs transition-colors ${
                              !n.isRead ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                            }`}
                          >
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {n.title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-6">
                          No notifications right now.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <SunMedium className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-elevated z-40 p-2 text-xs">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {user?.name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/onboarding');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Rerun Onboarding</span>
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Dynamic Page Router Outlet */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-16 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
