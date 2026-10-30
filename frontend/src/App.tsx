import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Layouts
import { AppLayout } from './layouts/AppLayout.js';
import { PublicLayout } from './layouts/PublicLayout.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EnergyMonitoringPage } from './pages/EnergyMonitoringPage.js';
import { ApplianceManagementPage } from './pages/ApplianceManagementPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { BillingPage } from './pages/BillingPage.js';
import { ForecastsPage } from './pages/ForecastsPage.js';
import { RecommendationsPage } from './pages/RecommendationsPage.js';
import { RenewablePage } from './pages/RenewablePage.js';
import { GoalsBudgetPage } from './pages/GoalsBudgetPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Authenticating Green Grid Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing & Info Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                {/* Onboarding Route */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Dashboard & Operations Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/monitoring" element={<EnergyMonitoringPage />} />
                  <Route path="/appliances" element={<ApplianceManagementPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/forecasts" element={<ForecastsPage />} />
                  <Route path="/recommendations" element={<RecommendationsPage />} />
                  <Route path="/renewable" element={<RenewablePage />} />
                  <Route path="/goals" element={<GoalsBudgetPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Fallback Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
