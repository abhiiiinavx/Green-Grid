import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { calculateBill } from './calculations.js';

export async function seedDatabase() {
  console.log('🌱 Seeding Green Grid database with realistic data...');

  // Clean existing tables (in order of relations)
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.energyAlert.deleteMany({});
  await prisma.energyRecommendation.deleteMany({});
  await prisma.energyForecast.deleteMany({});
  await prisma.energyConsumption.deleteMany({});
  await prisma.energyReading.deleteMany({});
  await prisma.energyGoal.deleteMany({});
  await prisma.energyBudget.deleteMany({});
  await prisma.solarSystem.deleteMany({});
  await prisma.battery.deleteMany({});
  await prisma.electricityTariff.deleteMany({});
  await prisma.appliance.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);

  // 1. Create Demo User
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@greengrid.io',
      passwordHash,
      name: 'Dr. Evelyn Reed',
      role: 'USER',
      isActive: true,
      profile: {
        create: {
          phone: '+91 98765 43210',
          location: 'Bengaluru, Karnataka',
          userType: 'HOME',
          currency: 'INR',
          monthlyBudget: 4200,
          energyGoalKwh: 280,
          carbonGoalReduction: 20,
          hasSolar: true,
          hasBattery: true,
          isOnboarded: true,
        },
      },
      solarSystem: {
        create: {
          capacityKw: 4.5,
          panelCount: 12,
          inverterModel: 'SunGrow Hybrid SG5.0RS',
          orientation: 'South-Facing (180°)',
          tiltAngle: 15.0,
          peakGenerationKw: 4.2,
          todayGenerationKwh: 16.4,
          lifetimeGenerationKwh: 4250.0,
          isActive: true,
        },
      },
      battery: {
        create: {
          capacityKwh: 10.0,
          currentChargePercent: 82.0,
          maxChargeRateKw: 3.3,
          maxDischargeRateKw: 3.3,
          state: 'CHARGING',
          healthPercent: 97.0,
          backupHoursEst: 7.2,
        },
      },
      tariffs: {
        create: {
          name: 'BESCOM Domestic LT-2(a) Slab Tariff',
          type: 'SLAB',
          baseRatePerKwh: 6.50,
          fixedMonthlyCharge: 140.0,
          taxPercent: 9.0,
          slab1Limit: 100,
          slab1Rate: 4.75,
          slab2Limit: 300,
          slab2Rate: 6.50,
          slab3Rate: 8.25,
          peakRate: 8.50,
          offPeakRate: 4.20,
          peakStartHour: 18,
          peakEndHour: 22,
          isActive: true,
        },
      },
    },
  });

  // 2. Create Admin User
  await prisma.user.create({
    data: {
      email: 'admin@greengrid.io',
      passwordHash: adminPasswordHash,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      profile: {
        create: {
          phone: '+91 98000 11223',
          location: 'Enterprise HQ, Bengaluru',
          userType: 'CAMPUS',
          currency: 'INR',
          monthlyBudget: 45000,
          energyGoalKwh: 5200,
          carbonGoalReduction: 25,
          hasSolar: true,
          hasBattery: true,
          isOnboarded: true,
        },
      },
    },
  });

  // 3. Create Realistic Appliances for Demo User
  const appliancesData = [
    {
      name: 'Living Room Inverter AC (1.5 Ton)',
      category: 'COOLING',
      powerRatingWatts: 1450,
      isSmart: true,
      isOn: true,
      priority: 'HIGH',
      room: 'Living Room',
      dailyAvgHours: 5.5,
      scheduleOn: '13:00',
      scheduleOff: '17:00',
      todayKwh: 4.8,
      monthlyEstCost: 1140,
    },
    {
      name: 'Master Bedroom Dual-Inverter AC',
      category: 'COOLING',
      powerRatingWatts: 1100,
      isSmart: true,
      isOn: false,
      priority: 'HIGH',
      room: 'Master Bedroom',
      dailyAvgHours: 6.0,
      scheduleOn: '22:30',
      scheduleOff: '06:00',
      todayKwh: 3.2,
      monthlyEstCost: 890,
    },
    {
      name: 'Inverter Refrigerator (350L)',
      category: 'KITCHEN',
      powerRatingWatts: 220,
      isSmart: true,
      isOn: true,
      priority: 'HIGH',
      room: 'Kitchen',
      dailyAvgHours: 24.0,
      todayKwh: 1.8,
      monthlyEstCost: 420,
    },
    {
      name: 'Instant Smart Geyser (25L)',
      category: 'HEATING',
      powerRatingWatts: 2000,
      isSmart: true,
      isOn: false,
      priority: 'MEDIUM',
      room: 'Bathroom',
      dailyAvgHours: 1.2,
      scheduleOn: '06:30',
      scheduleOff: '08:00',
      todayKwh: 2.1,
      monthlyEstCost: 510,
    },
    {
      name: 'Smart Induction Cooktop',
      category: 'KITCHEN',
      powerRatingWatts: 1800,
      isSmart: true,
      isOn: false,
      priority: 'MEDIUM',
      room: 'Kitchen',
      dailyAvgHours: 1.5,
      todayKwh: 1.4,
      monthlyEstCost: 380,
    },
    {
      name: 'Home Office Workstation & Multi-Monitor',
      category: 'ELECTRONICS',
      powerRatingWatts: 380,
      isSmart: true,
      isOn: true,
      priority: 'LOW',
      room: 'Study / Office',
      dailyAvgHours: 8.5,
      todayKwh: 2.6,
      monthlyEstCost: 610,
    },
    {
      name: 'Smart Eco Inverter Washing Machine',
      category: 'APPLIANCES',
      powerRatingWatts: 650,
      isSmart: true,
      isOn: false,
      priority: 'LOW',
      room: 'Utility Area',
      dailyAvgHours: 1.0,
      todayKwh: 0.7,
      monthlyEstCost: 175,
    },
    {
      name: 'Ambient LED & Task Lighting Grid',
      category: 'LIGHTING',
      powerRatingWatts: 140,
      isSmart: true,
      isOn: true,
      priority: 'LOW',
      room: 'Whole House',
      dailyAvgHours: 6.0,
      todayKwh: 0.8,
      monthlyEstCost: 190,
    },
  ];

  const createdAppliances = [];
  for (const app of appliancesData) {
    const created = await prisma.appliance.create({
      data: {
        userId: demoUser.id,
        ...app,
      },
    });
    createdAppliances.push(created);
  }

  // 4. Generate 60 Days of Realistic Daily and Hourly Energy Data
  console.log('⚡ Generating 60-day historical time-series energy records...');
  const now = new Date();
  const consumptionBatch = [];
  const tariffObj = {
    type: 'SLAB',
    baseRatePerKwh: 6.5,
    fixedMonthlyCharge: 140,
    taxPercent: 9,
    slab1Limit: 100,
    slab1Rate: 4.75,
    slab2Limit: 300,
    slab2Rate: 6.5,
    slab3Rate: 8.25,
  };

  let cumulativeThisMonthKwh = 0;
  let cumulativeLastMonthKwh = 0;

  for (let i = 60; i >= 0; i--) {
    const dateObj = new Date(now);
    dateObj.setDate(now.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0];
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isToday = i === 0;

    // Daily seasonal baseline with slight weekend surge (+15%)
    const baseDailyUsage = isWeekend ? 14.8 : 12.4;
    const variance = (Math.sin(i * 0.4) * 1.5) + (Math.cos(i * 0.9) * 0.8);
    const dailyKwh = Number((baseDailyUsage + variance + (Math.random() * 0.8 - 0.4)).toFixed(2));

    // Solar generation (bell curve daytime, ~14 to 18 kWh per sunny day)
    const solarDailyKwh = Number((14.5 + Math.sin(i * 0.25) * 2.2 + (Math.random() * 1.0)).toFixed(2));
    const directSolarKwh = Math.min(solarDailyKwh * 0.65, dailyKwh * 0.7);
    const gridKwh = Number(Math.max(0, dailyKwh - directSolarKwh).toFixed(2));
    const peakKwh = Number((dailyKwh * 0.38).toFixed(2));
    const offPeakKwh = Number((dailyKwh - peakKwh).toFixed(2));

    const bill = calculateBill(dailyKwh, tariffObj, peakKwh, offPeakKwh);
    const carbonKg = Number((gridKwh * 0.82).toFixed(2));

    // Track monthly totals
    if (i <= 30) {
      cumulativeThisMonthKwh += dailyKwh;
    } else {
      cumulativeLastMonthKwh += dailyKwh;
    }

    // Daily aggregate
    consumptionBatch.push({
      userId: demoUser.id,
      date: dateStr,
      hour: null,
      totalKwh: dailyKwh,
      cost: bill.totalBill,
      solarKwh: solarDailyKwh,
      gridKwh,
      peakKwh,
      offPeakKwh,
      carbonKg,
    });

    // For the last 7 days, also create hourly granular records
    if (i <= 7) {
      for (let h = 0; h < 24; h++) {
        // Realistic 24h curve:
        // 0-5: Night baseline (~0.25 kW)
        // 6-9: Morning peak (~1.1 kW)
        // 10-16: Midday moderate (~0.6 kW) + high solar
        // 17-22: Evening peak (~1.6 kW)
        // 23: Taper down (~0.4 kW)
        let hourlyMultiplier = 0.25;
        if (h >= 6 && h <= 9) hourlyMultiplier = 0.95 + Math.random() * 0.3;
        else if (h >= 10 && h <= 16) hourlyMultiplier = 0.55 + Math.random() * 0.25;
        else if (h >= 17 && h <= 22) hourlyMultiplier = 1.35 + Math.random() * 0.45;
        else if (h === 23) hourlyMultiplier = 0.45;
        else hourlyMultiplier = 0.22 + Math.random() * 0.08;

        const hKwh = Number(((dailyKwh / 18) * hourlyMultiplier).toFixed(3));
        let hSolar = 0;
        if (h >= 6 && h <= 18) {
          const sunPos = Math.sin(((h - 6) / 12) * Math.PI);
          hSolar = Number((solarDailyKwh * 0.12 * Math.max(0, sunPos)).toFixed(3));
        }
        const hGrid = Math.max(0, Number((hKwh - Math.min(hSolar, hKwh)).toFixed(3)));
        const isPeakH = h >= 18 && h <= 22;

        consumptionBatch.push({
          userId: demoUser.id,
          date: dateStr,
          hour: h,
          totalKwh: hKwh,
          cost: Number((hKwh * (isPeakH ? 8.5 : 5.5)).toFixed(2)),
          solarKwh: hSolar,
          gridKwh: hGrid,
          peakKwh: isPeakH ? hKwh : 0,
          offPeakKwh: isPeakH ? 0 : hKwh,
          carbonKg: Number((hGrid * 0.82).toFixed(3)),
        });
      }
    }
  }

  await prisma.energyConsumption.createMany({
    data: consumptionBatch,
  });

  // 5. Generate Instantaneous Energy Readings for Real-time Monitoring & Live stream
  console.log('📡 Generating instantaneous meter telemetry readings...');
  const readingsBatch = [];
  for (let m = 60; m >= 0; m--) {
    const time = new Date(now.getTime() - m * 60 * 1000);
    const hour = time.getHours();
    let loadKw = 1.25;
    if (hour >= 18 && hour <= 22) loadKw = 2.45 + (Math.random() * 0.4 - 0.2);
    else if (hour >= 6 && hour <= 9) loadKw = 1.65 + (Math.random() * 0.3 - 0.15);
    else if (hour >= 10 && hour <= 16) loadKw = 0.95 + (Math.random() * 0.2 - 0.1);
    else loadKw = 0.38 + (Math.random() * 0.08 - 0.04);

    let solarKw = 0;
    if (hour >= 6 && hour <= 18) {
      solarKw = Number((4.2 * Math.sin(((hour - 6) / 12) * Math.PI) + (Math.random() * 0.2 - 0.1)).toFixed(2));
      if (solarKw < 0) solarKw = 0;
    }

    const gridDrawKw = Number(Math.max(0, loadKw - solarKw).toFixed(2));
    const gridExportKw = Number(Math.max(0, solarKw - loadKw).toFixed(2));

    readingsBatch.push({
      userId: demoUser.id,
      timestamp: time,
      activePowerKw: Number(loadKw.toFixed(2)),
      voltage: Number((230 + Math.sin(m * 0.1) * 2.8 + (Math.random() * 0.8 - 0.4)).toFixed(1)),
      current: Number(((loadKw * 1000) / 230 / 0.97).toFixed(2)),
      frequency: Number((50.0 + (Math.random() * 0.08 - 0.04)).toFixed(2)),
      powerFactor: Number((0.97 + (Math.random() * 0.02 - 0.01)).toFixed(3)),
      energyConsumedKwh: Number((loadKw * (1 / 60)).toFixed(4)),
      solarGenerationKw: solarKw,
      gridDrawKw,
      gridExportKw,
      batterySocPercent: Number((82.0 + Math.sin(m * 0.05) * 3).toFixed(1)),
      batteryPowerKw: solarKw > loadKw ? 1.2 : -0.8,
      isSimulated: true,
    });
  }

  await prisma.energyReading.createMany({
    data: readingsBatch,
  });

  // 6. Create Smart AI Forecasts
  console.log('🤖 Creating AI demand & bill forecasts...');
  const forecastBatch = [];
  // Next 24 hours forecast
  for (let h = 0; h < 24; h++) {
    const fTime = new Date(now.getTime() + h * 3600 * 1000);
    const hour = fTime.getHours();
    const dateStr = fTime.toISOString().split('T')[0];
    let predKwh = 0.55;
    if (hour >= 18 && hour <= 22) predKwh = 1.45;
    else if (hour >= 6 && hour <= 9) predKwh = 0.98;
    else if (hour >= 10 && hour <= 16) predKwh = 0.62;
    else predKwh = 0.28;

    forecastBatch.push({
      userId: demoUser.id,
      forecastDate: `${dateStr} ${String(hour).padStart(2, '0')}:00`,
      forecastType: 'HOURLY',
      predictedKwh: Number(predKwh.toFixed(2)),
      predictedCost: Number((predKwh * (hour >= 18 && hour <= 22 ? 8.25 : 5.25)).toFixed(2)),
      confidenceLow: Number((predKwh * 0.88).toFixed(2)),
      confidenceHigh: Number((predKwh * 1.14).toFixed(2)),
      baselineKwh: Number((predKwh * 0.95).toFixed(2)),
      modelVersion: 'green-xgb-forecast-v2.1',
    });
  }

  // Next 7 days daily forecast
  for (let d = 1; d <= 7; d++) {
    const fDate = new Date(now.getTime() + d * 86400 * 1000);
    const dateStr = fDate.toISOString().split('T')[0];
    const isWknd = fDate.getDay() === 0 || fDate.getDay() === 6;
    const pKwh = isWknd ? 14.2 : 12.1;

    forecastBatch.push({
      userId: demoUser.id,
      forecastDate: dateStr,
      forecastType: 'DAILY',
      predictedKwh: pKwh,
      predictedCost: Number((pKwh * 6.5).toFixed(2)),
      confidenceLow: Number((pKwh * 0.9).toFixed(2)),
      confidenceHigh: Number((pKwh * 1.12).toFixed(2)),
      baselineKwh: 12.8,
      modelVersion: 'green-prophet-ensemble-v2.0',
    });
  }

  // Month-end bill forecast
  forecastBatch.push({
    userId: demoUser.id,
    forecastDate: '2026-10-31',
    forecastType: 'MONTH_END_BILL',
    predictedKwh: 268.5,
    predictedCost: 2185.0,
    confidenceLow: 1980.0,
    confidenceHigh: 2390.0,
    baselineKwh: 285.0,
    modelVersion: 'green-bill-regressor-v1.8',
  });

  await prisma.energyForecast.createMany({
    data: forecastBatch,
  });

  // 7. Create Actionable Smart Recommendations
  console.log('💡 Generating high-precision energy recommendations...');
  const recommendations = [
    {
      userId: demoUser.id,
      applianceId: createdAppliances[0]?.id,
      title: 'Optimize Evening Living Room AC Schedule',
      problem: 'Living Room AC accounts for 38% of your peak hours consumption (6 PM - 10 PM) when electricity rates are highest.',
      whyItMatters: 'Operating at 21°C during peak grid demand hours accelerates compressor cycling and incurs higher slab tariff progression.',
      suggestedAction: 'Increase AC setpoint to 24°C with eco-inverter mode and activate sleep timer 45 minutes earlier.',
      impactLevel: 'HIGH',
      potentialMonthlySavingsKwh: 42.0,
      potentialMonthlySavingsCost: 346.5,
      difficulty: 'EASY',
      category: 'APPLIANCE',
    },
    {
      userId: demoUser.id,
      title: 'Shift Water Geyser Pre-heating to Solar Peak Window',
      problem: 'Water heater operates between 6:30 AM - 7:30 AM before rooftop solar irradiance begins, drawing entirely from the grid.',
      whyItMatters: 'Water heating requires 2.0 kW instant draw. Shifting heating to 11:30 AM or using smart scheduling utilizes 100% free rooftop solar generation.',
      suggestedAction: 'Set geyser smart timer for 11:30 AM - 1:00 PM to leverage peak 4.2 kW solar output.',
      impactLevel: 'HIGH',
      potentialMonthlySavingsKwh: 31.5,
      potentialMonthlySavingsCost: 260.0,
      difficulty: 'EASY',
      category: 'SOLAR',
    },
    {
      userId: demoUser.id,
      applianceId: createdAppliances[5]?.id,
      title: 'Mitigate Workstation Standby Phantom Load',
      problem: 'Home office monitors, docking station, and peripherals consume an aggregate 48W continuously in standby mode throughout the night.',
      whyItMatters: 'Continuous vampire draw accumulates 34.5 kWh per month without contributing to active productivity.',
      suggestedAction: 'Enable auto-cutoff smart strip on the workstation outlet to disconnect standby peripherals at 8:00 PM.',
      impactLevel: 'MEDIUM',
      potentialMonthlySavingsKwh: 14.5,
      potentialMonthlySavingsCost: 119.5,
      difficulty: 'EASY',
      category: 'BEHAVIORAL',
    },
    {
      userId: demoUser.id,
      applianceId: createdAppliances[2]?.id,
      title: 'Refrigerator Defrost Cycle Calibration',
      problem: 'Refrigerator thermal duty cycle increased by 14% over the last 3 weeks due to condenser coil dust buildup.',
      whyItMatters: 'Reduced heat dissipation forces the inverter compressor to run at higher RPM for longer durations.',
      suggestedAction: 'Clean rear condenser coils and ensure 4 inches clearance from kitchen back wall.',
      impactLevel: 'QUICK_WIN',
      potentialMonthlySavingsKwh: 9.2,
      potentialMonthlySavingsCost: 76.0,
      difficulty: 'EASY',
      category: 'APPLIANCE',
    },
    {
      userId: demoUser.id,
      title: 'Batch Eco-Washing Machine Cycles on Weekends',
      problem: 'Running half-loaded washing cycles mid-week increases water heating and motor energy per kg of laundry.',
      whyItMatters: 'Full load eco-mode cycles at 30°C reduce motor runtime by 28% and eliminate resistive water heating overhead.',
      suggestedAction: 'Run 2 full loads in Eco 30°C mode during solar midday window on Saturday.',
      impactLevel: 'QUICK_WIN',
      potentialMonthlySavingsKwh: 6.8,
      potentialMonthlySavingsCost: 56.0,
      difficulty: 'EASY',
      category: 'BEHAVIORAL',
    },
  ];

  await prisma.energyRecommendation.createMany({
    data: recommendations,
  });

  // 8. Create Realistic Alerts
  console.log('🚨 Generating intelligent alerts and notifications...');
  const alerts = [
    {
      userId: demoUser.id,
      applianceId: createdAppliances[0]?.id,
      title: 'Unusual Evening Load Surge Detected',
      message: 'Active power draw exceeded 2.6 kW for 75 consecutive minutes between 7:15 PM and 8:30 PM (28% above your typical Tuesday baseline).',
      alertType: 'UNUSUAL_USAGE',
      severity: 'WARNING',
      metricValue: 2.6,
      thresholdValue: 2.0,
      isRead: false,
    },
    {
      userId: demoUser.id,
      title: 'Monthly Budget Milestone: 75% Consumed',
      message: 'You have consumed ₹2,640 (75.4%) of your ₹3,500 monthly budget with 9 days remaining in the billing cycle.',
      alertType: 'BUDGET_THRESHOLD',
      severity: 'WARNING',
      metricValue: 2640,
      thresholdValue: 2625,
      isRead: false,
    },
    {
      userId: demoUser.id,
      title: 'Optimal Solar Generation Window Active',
      message: 'Rooftop solar is generating 3.9 kW (93% capacity). Recommended time to charge battery storage or run heavy appliances.',
      alertType: 'SOLAR_DROP',
      severity: 'INFO',
      metricValue: 3.9,
      thresholdValue: 3.5,
      isRead: true,
    },
    {
      userId: demoUser.id,
      applianceId: createdAppliances[3]?.id,
      title: 'High Wattage Appliance Running During Peak Hours',
      message: 'Instant Smart Geyser (2000W) was turned on during peak tariff hours (7:45 PM). Consider scheduling for off-peak.',
      alertType: 'HIGH_CONSUMPTION',
      severity: 'WARNING',
      metricValue: 2.0,
      thresholdValue: 1.5,
      isRead: true,
    },
  ];

  await prisma.energyAlert.createMany({
    data: alerts,
  });

  // 9. Create Notifications
  const notifications = [
    {
      userId: demoUser.id,
      title: 'Weekly Energy Summary Ready',
      message: 'Great job! You reduced your electricity consumption by 6.4% this week compared with last week, saving ₹184.',
      type: 'SYSTEM',
      link: '/analytics',
      isRead: false,
    },
    {
      userId: demoUser.id,
      title: 'AI Anomaly Detected',
      message: 'Unusual evening load surge detected on Living Room AC.',
      type: 'ALERT',
      link: '/alerts',
      isRead: false,
    },
    {
      userId: demoUser.id,
      title: 'New High-Impact Recommendation',
      message: 'Optimize your evening AC temperature setpoint to save up to ₹346/mo.',
      type: 'RECOMMENDATION',
      link: '/recommendations',
      isRead: true,
    },
  ];

  await prisma.notification.createMany({
    data: notifications,
  });

  // 10. Create Energy Goals and Monthly Budgets
  console.log('🎯 Setting up energy goals and budget milestones...');
  await prisma.energyGoal.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'Monthly Consumption Target',
        goalType: 'MONTHLY_KWH',
        targetValue: 250,
        currentValue: 184.2,
        unit: 'kWh',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        status: 'ON_TRACK',
      },
      {
        userId: demoUser.id,
        title: 'Monthly Electricity Budget',
        goalType: 'MONTHLY_COST',
        targetValue: 2800,
        currentValue: 2180,
        unit: 'INR',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        status: 'ON_TRACK',
      },
      {
        userId: demoUser.id,
        title: 'Carbon Footprint Reduction',
        goalType: 'CARBON_REDUCTION',
        targetValue: 25,
        currentValue: 18.5,
        unit: '%',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        status: 'ON_TRACK',
      },
      {
        userId: demoUser.id,
        title: 'Solar Self-Consumption Ratio',
        goalType: 'SOLAR_SELF_CONSUMPTION',
        targetValue: 70,
        currentValue: 64.2,
        unit: '%',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        status: 'ON_TRACK',
      },
    ],
  });

  // Budget for current month
  await prisma.energyBudget.create({
    data: {
      userId: demoUser.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      budgetAmount: 3500,
      currentSpent: 2180,
      projectedSpent: 2950,
      alertThresholdPercent: 85,
    },
  });

  console.log('✅ Database successfully seeded with rich Green Grid telemetry & analytics!');
}

seedDatabase()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
