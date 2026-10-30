import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Activity,
  Sparkles,
  TrendingDown,
  Sun,
  ShieldCheck,
  Cpu,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  BatteryCharging,
  Leaf,
  Sliders,
  DollarSign,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';

export const LandingPage: React.FC = () => {
  // Interactive ROI Calculator State
  const [monthlyBill, setMonthlyBill] = useState(4500);
  const [hasSolar, setHasSolar] = useState(true);

  const estimatedMonthlySavings = Math.round(monthlyBill * (hasSolar ? 0.32 : 0.18));
  const estimatedAnnualSavings = estimatedMonthlySavings * 12;
  const estimatedCo2AbatementKg = Math.round((estimatedAnnualSavings / 6.5) * 0.82);

  return (
    <div className="space-y-24 py-10 sm:py-16">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
            <span>Next-Gen Smart Energy OS • IoT & AI Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Understand your energy.{' '}
            <span className="text-emerald-600 dark:text-emerald-400">Use it smarter.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Green Grid transforms raw electricity meter telemetry into clear appliance-wise insights, predictive demand forecasts, and high-impact waste reduction strategies.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/login">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Live Demo
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Works without hardware (Simulated Demo)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ESP32 & Smart Meter Ready</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Multi-tier Slab & ToU Tariffs</span>
            </span>
          </div>
        </div>

        {/* Live Interactive Preview Card Mockup */}
        <div className="mt-12 relative max-w-5xl mx-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-elevated p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-mono text-slate-500 font-medium hidden sm:inline">
                Green Grid Enterprise OS — Live Telemetry Preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                ACTIVE LOAD: 1.45 kW
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-500 uppercase font-medium">Today's Usage</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">12.8 kWh</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">↓ 8.4% vs yesterday</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-500 uppercase font-medium">Solar Generation</p>
              <p className="text-xl font-bold text-amber-500 font-mono mt-1">16.4 kWh</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">68% Self-Consumed</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-500 uppercase font-medium">Projected Bill</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">₹2,185</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">On Track (Budget ₹3,500)</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-500 uppercase font-medium">Carbon Offset</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">13.4 kg</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">~0.6 Trees Eq.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE LOOP: COLLECT -> ANALYZE -> PREDICT -> ALERT -> RECOMMEND -> OPTIMIZE */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Continuous Intelligence
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            The Closed-Loop Energy Optimization Engine
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Every watt of energy is captured, analyzed against historical baselines, and converted into concrete cost-saving actions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'COLLECT',
              description: 'Ingest live telemetry (Active Power, Voltage, Current, Frequency, PF) from smart meters or high-fidelity simulator.',
              icon: <Activity className="w-5 h-5 text-emerald-500" />,
            },
            {
              step: '02',
              title: 'ANALYZE',
              description: 'Disaggregate appliance signatures, Time-of-Use peak vs off-peak distribution, and weekend load variance.',
              icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
            },
            {
              step: '03',
              title: 'PREDICT',
              description: 'AI forecasts 24-hour demand curves and month-end slab billing projections with confidence intervals.',
              icon: <Sparkles className="w-5 h-5 text-purple-500" />,
            },
            {
              step: '04',
              title: 'ALERT',
              description: 'Immediate anomaly detection for sudden spikes, phantom standby loads, and budget threshold milestones.',
              icon: <Zap className="w-5 h-5 text-amber-500" />,
            },
            {
              step: '05',
              title: 'RECOMMEND',
              description: 'Actionable recommendations categorized into High Impact, Medium, and Quick Wins with calculated ₹ savings.',
              icon: <TrendingDown className="w-5 h-5 text-emerald-500" />,
            },
            {
              step: '06',
              title: 'OPTIMIZE',
              description: 'Automate schedule setpoints, shift heating to peak solar windows, and achieve steady carbon abatement.',
              icon: <Leaf className="w-5 h-5 text-teal-500" />,
            },
          ].map((item) => (
            <Card key={item.step} className="relative p-6 hover:border-emerald-500/40 transition-colors">
              <span className="text-2xl font-black text-slate-200 dark:text-slate-800 absolute top-4 right-5 font-mono">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE ROI SAVINGS CALCULATOR */}
      <section id="roi" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-12 border border-slate-800 relative overflow-hidden shadow-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Instant Waste Reduction Projection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Calculate your potential electricity savings
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Adjust your approximate monthly electricity spend to see realistic annual financial savings and carbon footprint abatement powered by Green Grid.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-300">Average Monthly Electricity Bill</span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">₹{monthlyBill.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="30000"
                    step="500"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>₹1,000</span>
                    <span>₹15,000</span>
                    <span>₹30,000</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setHasSolar(!hasSolar)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      hasSolar
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {hasSolar ? '☀️ Rooftop Solar Enabled (+14% Extra Savings)' : '☀️ Enable Rooftop Solar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-800/80 rounded-2xl p-6 border border-slate-700 flex flex-col justify-between space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80">
                  <p className="text-xs text-slate-400 uppercase font-medium">Estimated Monthly Savings</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono mt-1">
                    ₹{estimatedMonthlySavings.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">~{hasSolar ? '32%' : '18%'} of current bill</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80">
                  <p className="text-xs text-slate-400 uppercase font-medium">Annualized Savings</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono mt-1">
                    ₹{estimatedAnnualSavings.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1">Pure direct savings/yr</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-400">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Estimated Annual CO₂ Abatement</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{estimatedCo2AbatementKg} kg CO₂e / year</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  ~{(estimatedCo2AbatementKg / 21.7).toFixed(1)} Trees Eq.
                </span>
              </div>

              <Link to="/register" className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Start Saving With Green Grid
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM FEATURES GRID */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Enterprise Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Engineered for Households, Campuses & Businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Slab-Based & ToU Billing Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Supports complex domestic and commercial slab tariffs (e.g. 0-100, 101-300, 301+ kWh), fixed charges, and Time-of-Use peak surge rates.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Renewable Solar & Battery Flow
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Track real-time generation curves, self-consumption fractions, battery storage state of charge, and net metering grid export credits.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Demand & Anomaly Detection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Identifies vampire standby loads, prolonged abnormal appliance draws, and forecasts next 24-hour demand with statistical confidence intervals.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-emerald-600 text-white text-center flex flex-col items-center space-y-5 shadow-elevated">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight max-w-xl">
            Ready to take complete control of your energy?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg leading-relaxed">
            Join households, offices, and campuses reducing electricity bills by up to 30% with Green Grid.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 font-semibold shadow-md">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Sign In to Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
