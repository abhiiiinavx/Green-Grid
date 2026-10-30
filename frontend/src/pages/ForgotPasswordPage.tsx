import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';

export const ForgotPasswordPage: React.FC = () => {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setIsSubmitted(true);
      success('Password reset instructions sent.');
    } catch (err: any) {
      error(err.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-emerald-600 text-white items-center justify-center shadow-sm mb-1">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reset your password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Enter your email to receive recovery instructions
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Check your email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                If an account exists for <span className="font-semibold">{email}</span>, we've sent password reset instructions.
              </p>
              <Link to="/login" className="block pt-2">
                <Button variant="primary" size="sm" className="w-full justify-center">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center mt-2"
                isLoading={isSubmitting}
              >
                Send Reset Link
              </Button>

              <div className="pt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
