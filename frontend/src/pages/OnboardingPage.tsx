import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  Building,
  Store,
  GraduationCap,
  Sun,
  BatteryCharging,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sliders,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import confetti from 'canvas-confetti';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [userType, setUserType] = useState<string>(user?.profile?.userType || 'HOME');
  const [monthlyUsageKwh, setMonthlyUsageKwh] = useState(250);
  const [tariffRate, setTariffRate] = useState(6.5);
  const [applianceCount, setApplianceCount] = useState(6);
  const [hasSolar, setHasSolar] = useState(true);
  const [hasBattery, setHasBattery] = useState(true);
  const [location, setLocation] = useState(user?.profile?.location || 'Bengaluru, India');

  const userTypeOptions = [
    { type: 'HOME', label: 'Home / Apartment', desc: 'Residential flats, independent houses', icon: <Home className="w-5 h-5" /> },
    { type: 'HOSTEL', label: 'Hostel / PG', desc: 'Student dorms, co-living facilities', icon: <Building className="w-5 h-5" /> },
    { type: 'OFFICE', label: 'Office Space', desc: 'Corporate floors, co-working suites', icon: <Building2 className="w-5 h-5" /> },
    { type: 'SMALL_BUSINESS', label: 'Small Business', desc: 'Retail shops, clinics, cafes, workshops', icon: <Store className="w-5 h-5" /> },
    { type: 'CAMPUS', label: 'Campus / Institution', desc: 'Colleges, schools, industrial facilities', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const updatedProfile = await apiRequest('/users/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          userType,
          approxMonthlyUsageKwh: monthlyUsageKwh,
          tariffRate,
          applianceCount,
          hasSolar,
          hasBattery,
          location,
        }),
      });

      updateUser({ profile: updatedProfile });

      // Trigger congratulatory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (cErr) {
        // Safe fallback
      }

      success('Personalized dashboard generated successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Progress Bar Header */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>STEP {step} OF 4</span>
            <span>{Math.round((step / 4) * 100)}% COMPLETED</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: User Type Selection */}
        {step === 1 && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                What type of property are you monitoring?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Green Grid calibrates consumption baselines and appliance schedules to your property type.
              </p>
            </div>

            <div className="space-y-2.5">
              {userTypeOptions.map((opt) => (
                <div
                  key={opt.type}
                  onClick={() => setUserType(opt.type)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    userType === opt.type
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        userType === opt.type
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {opt.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                    </div>
                  </div>
                  {userType === opt.type && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Consumption & Tariff */}
        {step === 2 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Monthly Usage & Electricity Tariff
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Provide estimates so we can configure accurate billing projections.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>Approximate Monthly Electricity Usage</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    {monthlyUsageKwh} kWh / month
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={monthlyUsageKwh}
                  onChange={(e) => setMonthlyUsageKwh(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>50 kWh (Low)</span>
                  <span>500 kWh (Avg)</span>
                  <span>2000+ kWh (Heavy)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Approximate Electricity Tariff Rate (per kWh)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono text-xs text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="1"
                    max="30"
                    value={tariffRate}
                    onChange={(e) => setTariffRate(parseFloat(e.target.value) || 6.5)}
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard residential slab average is ₹6.50 / kWh. You can fine-tune slab limits later.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Location (City / Grid Region)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="E.g. Bengaluru, India"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="md" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Appliances */}
        {step === 3 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Connected Appliances
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                How many major power-consuming appliances do you operate?
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Number of Major Appliances</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {applianceCount} Devices
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={applianceCount}
                onChange={(e) => setApplianceCount(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                We'll pre-populate realistic appliances (Air Conditioners, Water Geysers, Refrigerator, Induction Cooktop, Lighting) that you can manage and toggle on the dashboard.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="md" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Solar & Battery */}
        {step === 4 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Renewable Energy & Storage
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure rooftop solar generation and battery backup telemetry.
              </p>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setHasSolar(!hasSolar)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  hasSolar
                    ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500 text-slate-950">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Do you have Rooftop Solar?</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enables real-time generation curves and solar self-consumption tracking
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hasSolar}
                  onChange={() => {}}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </div>

              <div
                onClick={() => setHasBattery(!hasBattery)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  hasBattery
                    ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-white">
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Do you have Battery Storage?</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tracks state of charge, charge/discharge rates, and estimated backup runtime
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hasBattery}
                  onChange={() => {}}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="md" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFinishOnboarding}
                isLoading={isSubmitting}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Generate Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
