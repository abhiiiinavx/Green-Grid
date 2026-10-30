import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Zap, Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';

export const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
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
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link to="/#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Platform
            </Link>
            <Link to="/#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              How It Works
            </Link>
            <Link to="/#analytics" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Analytics & AI
            </Link>
            <Link to="/#roi" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              ROI Calculator
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunMedium className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">GREEN GRID</span>
            <span>— Understand your energy. Reduce your waste.</span>
          </div>
          <p>© {new Date().getFullYear()} Green Grid Technologies. Production-Ready Energy Management.</p>
        </div>
      </footer>
    </div>
  );
};
