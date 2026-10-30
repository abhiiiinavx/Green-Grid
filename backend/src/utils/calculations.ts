import { config } from '../config/index.js';

export interface TariffParams {
  type: 'FLAT' | 'SLAB' | 'TIME_OF_USE' | string;
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
}

export interface BillBreakdown {
  energyCharges: number;
  fixedCharges: number;
  taxAmount: number;
  totalBill: number;
  effectiveRatePerKwh: number;
  slabBreakdown?: Array<{
    slab: string;
    units: number;
    rate: number;
    amount: number;
  }>;
}

/**
 * Calculates electricity bill with support for Slab, Flat, and Time-of-Use tariffs
 */
export function calculateBill(
  totalKwh: number,
  tariff: TariffParams,
  peakKwh: number = 0,
  offPeakKwh: number = 0
): BillBreakdown {
  let energyCharges = 0;
  const slabBreakdown: BillBreakdown['slabBreakdown'] = [];

  if (tariff.type === 'SLAB') {
    const s1Limit = tariff.slab1Limit ?? 100;
    const s1Rate = tariff.slab1Rate ?? 4.75;
    const s2Limit = tariff.slab2Limit ?? 300;
    const s2Rate = tariff.slab2Rate ?? 6.50;
    const s3Rate = tariff.slab3Rate ?? 8.25;

    if (totalKwh <= s1Limit) {
      const amt1 = totalKwh * s1Rate;
      energyCharges += amt1;
      slabBreakdown.push({ slab: `0 - ${s1Limit} kWh`, units: totalKwh, rate: s1Rate, amount: amt1 });
    } else if (totalKwh <= s2Limit) {
      const amt1 = s1Limit * s1Rate;
      const units2 = totalKwh - s1Limit;
      const amt2 = units2 * s2Rate;
      energyCharges += amt1 + amt2;
      slabBreakdown.push(
        { slab: `0 - ${s1Limit} kWh`, units: s1Limit, rate: s1Rate, amount: amt1 },
        { slab: `${s1Limit + 1} - ${s2Limit} kWh`, units: units2, rate: s2Rate, amount: amt2 }
      );
    } else {
      const amt1 = s1Limit * s1Rate;
      const units2 = s2Limit - s1Limit;
      const amt2 = units2 * s2Rate;
      const units3 = totalKwh - s2Limit;
      const amt3 = units3 * s3Rate;
      energyCharges += amt1 + amt2 + amt3;
      slabBreakdown.push(
        { slab: `0 - ${s1Limit} kWh`, units: s1Limit, rate: s1Rate, amount: amt1 },
        { slab: `${s1Limit + 1} - ${s2Limit} kWh`, units: units2, rate: s2Rate, amount: amt2 },
        { slab: `>${s2Limit} kWh`, units: units3, rate: s3Rate, amount: amt3 }
      );
    }
  } else if (tariff.type === 'TIME_OF_USE') {
    const pRate = tariff.peakRate ?? 8.50;
    const opRate = tariff.offPeakRate ?? 4.20;
    const pAmt = peakKwh * pRate;
    const opAmt = offPeakKwh * opRate;
    energyCharges = pAmt + opAmt;
    slabBreakdown.push(
      { slab: 'Peak Hours', units: peakKwh, rate: pRate, amount: pAmt },
      { slab: 'Off-Peak Hours', units: offPeakKwh, rate: opRate, amount: opAmt }
    );
  } else {
    // FLAT
    const rate = tariff.baseRatePerKwh || 6.5;
    energyCharges = totalKwh * rate;
    slabBreakdown.push({ slab: 'Flat Rate', units: totalKwh, rate, amount: energyCharges });
  }

  const fixedCharges = tariff.fixedMonthlyCharge || 0;
  const subtotal = energyCharges + fixedCharges;
  const taxAmount = (subtotal * (tariff.taxPercent || 0)) / 100;
  const totalBill = Number((subtotal + taxAmount).toFixed(2));
  const effectiveRatePerKwh = totalKwh > 0 ? Number((totalBill / totalKwh).toFixed(2)) : tariff.baseRatePerKwh;

  return {
    energyCharges: Number(energyCharges.toFixed(2)),
    fixedCharges: Number(fixedCharges.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalBill,
    effectiveRatePerKwh,
    slabBreakdown,
  };
}

/**
 * Calculates carbon emissions in kg CO2e
 */
export function calculateCarbonEmissions(gridKwh: number): {
  emissionsKg: number;
  treesEquivalent: number;
  vehicleKmEquivalent: number;
} {
  const emissionsKg = Number((gridKwh * config.carbonEmissionFactorKgPerKwh).toFixed(2));
  // 1 mature tree absorbs ~21.77 kg CO2 per year (~0.0596 kg per day)
  const treesEquivalent = Number((emissionsKg / 21.77).toFixed(1));
  // Average gasoline car emits ~0.192 kg CO2 per km
  const vehicleKmEquivalent = Number((emissionsKg / 0.192).toFixed(1));

  return {
    emissionsKg,
    treesEquivalent,
    vehicleKmEquivalent,
  };
}

/**
 * Calculates percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): {
  changePercent: number;
  isIncrease: boolean;
  formatted: string;
} {
  if (previous === 0) {
    return {
      changePercent: 0,
      isIncrease: current > 0,
      formatted: current > 0 ? '+100%' : '0%',
    };
  }

  const diff = current - previous;
  const changePercent = Number(((diff / previous) * 100).toFixed(1));
  const isIncrease = changePercent > 0;
  const formatted = `${isIncrease ? '↑ +' : '↓ '}${Math.abs(changePercent)}%`;

  return {
    changePercent,
    isIncrease,
    formatted,
  };
}

/**
 * Estimates battery backup hours remaining given current active power draw (kW)
 */
export function calculateBatteryBackup(
  capacityKwh: number,
  currentChargePercent: number,
  currentLoadKw: number
): number {
  if (currentLoadKw <= 0.05) return 24; // Idle limit
  const usableKwh = (capacityKwh * currentChargePercent) / 100;
  const backupHours = usableKwh / currentLoadKw;
  return Number(Math.min(backupHours, 48).toFixed(1));
}
