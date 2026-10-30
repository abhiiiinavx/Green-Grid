// TypeScript Type Definitions for Green Grid

export type UserType = 'HOME' | 'HOSTEL' | 'OFFICE' | 'SMALL_BUSINESS' | 'CAMPUS';
export type UserRole = 'USER' | 'ADMIN';
export type TariffType = 'FLAT' | 'SLAB' | 'TIME_OF_USE';

export type ApplianceCategory =
  | 'COOLING'
  | 'HEATING'
  | 'LIGHTING'
  | 'KITCHEN'
  | 'ELECTRONICS'
  | 'APPLIANCES'
  | 'HEAVY_MACHINERY'
  | 'OTHER';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'QUICK_WIN';
export type GoalType = 'MONTHLY_KWH' | 'MONTHLY_COST' | 'CARBON_REDUCTION' | 'SOLAR_SELF_CONSUMPTION';
export type GoalStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'ACHIEVED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  phone?: string;
  location: string;
  userType: UserType;
  currency: string;
  monthlyBudget: number;
  energyGoalKwh: number;
  carbonGoalReduction: number;
  hasSolar: boolean;
  hasBattery: boolean;
  isOnboarded: boolean;
}

export interface ElectricityTariff {
  id?: string;
  name: string;
  type: TariffType;
  baseRatePerKwh: number;
  fixedMonthlyCharge: number;
  taxPercent: number;
  slab1Limit?: number;
  slab1Rate?: number;
  slab2Limit?: number;
  slab2Rate?: number;
  slab3Rate?: number;
  peakRate?: number;
  offPeakRate?: number;
  peakStartHour?: number;
  peakEndHour?: number;
  isActive?: boolean;
}

export interface Appliance {
  id: string;
  userId: string;
  name: string;
  category: ApplianceCategory;
  powerRatingWatts: number;
  isSmart: boolean;
  isOn: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  room: string;
  dailyAvgHours: number;
  scheduleOn?: string | null;
  scheduleOff?: string | null;
  todayKwh: number;
  monthlyEstCost: number;
  calculatedDailyKwh?: number;
  calculatedMonthlyKwh?: number;
  calculatedMonthlyCost?: number;
  unreadAlertsCount?: number;
}

export interface EnergyReading {
  id: string;
  timestamp: string;
  activePowerKw: number;
  voltage: number;
  current: number;
  frequency: number;
  powerFactor: number;
  solarGenerationKw: number;
  gridDrawKw: number;
  gridExportKw: number;
  batterySocPercent: number;
  batteryPowerKw: number;
  isSimulated: boolean;
}

export interface EnergyConsumptionPoint {
  label: string;
  time?: string;
  date?: string;
  kwh: number;
  cost: number;
  value: number;
  solarKwh: number;
  gridKwh: number;
  peakKwh?: number;
  offPeakKwh?: number;
  carbonKg?: number;
  isPeak?: boolean;
}

export interface DashboardData {
  user: {
    location: string;
    userType: UserType;
    currency: string;
    hasSolar: boolean;
    hasBattery: boolean;
  };
  kpis: {
    currentPower: {
      valueKw: number;
      unit: string;
      status: 'normal' | 'high';
    };
    todayEnergy: {
      valueKwh: number;
      unit: string;
      comparison: string;
      isIncrease: boolean;
      comparisonLabel: string;
    };
    thisMonthEnergy: {
      valueKwh: number;
      unit: string;
      comparison: string;
      isIncrease: boolean;
      comparisonLabel: string;
    };
    estimatedBill: {
      value: number;
      currency: string;
      projectedMonthEnd: number;
      comparison: string;
      isIncrease: boolean;
      comparisonLabel: string;
    };
    carbonEmissions: {
      valueKg: number;
      todayKg: number;
      treesEquivalent: number;
      vehicleKmEquivalent: number;
      unit: string;
    };
  };
  energyFlow: {
    solarGenerationKw: number;
    homeLoadKw: number;
    batterySocPercent: number;
    batteryPowerKw: number;
    batteryState: string;
    batteryBackupHours: number;
    gridDrawKw: number;
    gridExportKw: number;
  };
  applianceBreakdown: Array<{
    id: string;
    name: string;
    category: ApplianceCategory;
    powerRatingWatts: number;
    isOn: boolean;
    room: string;
    dailyKwh: number;
    percentage: number;
    estimatedMonthlyCost: number;
  }>;
  smartInsights: Array<{
    id: string;
    title: string;
    description: string;
    type: 'POSITIVE' | 'NEUTRAL' | 'ALERT';
    metric: string;
  }>;
  tariff: ElectricityTariff;
  simulation: {
    isLive: boolean;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  problem: string;
  whyItMatters: string;
  suggestedAction: string;
  impactLevel: ImpactLevel;
  potentialMonthlySavingsKwh: number;
  potentialMonthlySavingsCost: number;
  difficulty: 'EASY' | 'MODERATE' | 'ADVANCED';
  category: string;
  isDismissed: boolean;
  isApplied: boolean;
  appliance?: {
    id: string;
    name: string;
    category: ApplianceCategory;
    powerRatingWatts: number;
    isOn: boolean;
  };
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  alertType: string;
  severity: AlertSeverity;
  isRead: boolean;
  isDismissed: boolean;
  metricValue?: number;
  thresholdValue?: number;
  createdAt: string;
  appliance?: {
    id: string;
    name: string;
    category: ApplianceCategory;
  };
}

export interface Goal {
  id: string;
  title: string;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  percentage?: number;
}

export interface Budget {
  id?: string;
  month: number;
  year: number;
  budgetAmount: number;
  currentSpent: number;
  projectedSpent: number;
  alertThresholdPercent: number;
  spentPercent?: number;
  isOverThreshold?: boolean;
  remainingDays?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'RECOMMENDATION' | 'SYSTEM' | 'BUDGET';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
