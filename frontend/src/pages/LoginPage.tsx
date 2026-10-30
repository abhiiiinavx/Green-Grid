import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo, loginAsAdmin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      success('Welcome back to Green Grid!');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Invalid credentials');
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await loginAsDemo();
      success('Logged in as Demo User (Dr. Evelyn Reed)');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Demo login failed');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsAdminLoading(true);
    try {
      await loginAsAdmin();
      success('Logged in as System Administrator');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Admin login failed');
    } finally {
      setIsAdminLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-emerald-600 text-white items-center justify-center shadow-sm mb-1">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to Green Grid
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Smart Energy Management & Analytics Platform
          </p>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
          <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-center">
            One-Click Instant Evaluation
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoLogin}
              isLoading={isDemoLoading}
              leftIcon={<UserIcon className="w-3.5 h-3.5 text-emerald-600" />}
              className="bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-200 text-xs py-2"
            >
              Demo User
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdminLogin}
              isLoading={isAdminLoading}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-rose-500" />}
              className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs py-2"
            >
              Admin Portal
            </Button>
          </div>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center mt-2"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
