import { prisma } from '../config/prisma.js';

class SimulationService {
  private isSimulationRunning: boolean = true;
  private activeInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startBackgroundSimulation();
  }

  public isRunning(): boolean {
    return this.isSimulationRunning;
  }

  public setRunningState(running: boolean): boolean {
    this.isSimulationRunning = running;
    return this.isSimulationRunning;
  }

  public async generateInstantTelemetry(userId: string) {
    const now = new Date();
    const hour = now.getHours();

    // Query active user's appliances
    const activeAppliances = await prisma.appliance.findMany({
      where: { userId, isOn: true },
    });

    const baseLoadKw = 0.25; // Continuous standby & background
    const activeAppliancePowerWatts = activeAppliances.reduce((sum, a) => sum + a.powerRatingWatts, 0);
    const activeApplianceKw = activeAppliancePowerWatts / 1000;

    // Circadian variation noise
    let timeVariance = 0.15;
    if (hour >= 18 && hour <= 22) timeVariance = 0.45; // Evening peak
    else if (hour >= 6 && hour <= 9) timeVariance = 0.3; // Morning peak

    const noise = (Math.random() * 0.1 - 0.05);
    const activePowerKw = Number(Math.max(0.15, baseLoadKw + activeApplianceKw + timeVariance + noise).toFixed(2));

    // Solar generation (Rooftop solar curve 6 AM - 6 PM)
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    let solarKw = 0;
    if (userProfile?.hasSolar && hour >= 6 && hour <= 18) {
      const solarSystem = await prisma.solarSystem.findUnique({ where: { userId } });
      const capacity = solarSystem?.capacityKw || 4.5;
      const sunPosition = Math.sin(((hour - 6) / 12) * Math.PI);
      solarKw = Number((capacity * Math.max(0, sunPosition) * 0.88 + (Math.random() * 0.2 - 0.1)).toFixed(2));
      if (solarKw < 0) solarKw = 0;
    }

    // Grid draw & export
    const netLoad = activePowerKw - solarKw;
    const gridDrawKw = netLoad > 0 ? Number(netLoad.toFixed(2)) : 0;
    const gridExportKw = netLoad < 0 ? Number(Math.abs(netLoad).toFixed(2)) : 0;

    // Battery state
    let batterySocPercent = 78.0;
    let batteryPowerKw = 0;
    const battery = await prisma.battery.findUnique({ where: { userId } });
    if (battery) {
      batterySocPercent = battery.currentChargePercent;
      if (gridExportKw > 0 && batterySocPercent < 98) {
        batteryPowerKw = Number(Math.min(2.5, gridExportKw).toFixed(2)); // Charging
      } else if (gridDrawKw > 1.5 && batterySocPercent > 20) {
        batteryPowerKw = Number(-Math.min(1.8, gridDrawKw).toFixed(2)); // Discharging
      }
    }

    // Electrical telemetry
    const voltage = Number((230.0 + (Math.random() * 3.5 - 1.75)).toFixed(1));
    const frequency = Number((50.0 + (Math.random() * 0.06 - 0.03)).toFixed(2));
    const powerFactor = Number((0.97 + (Math.random() * 0.02 - 0.01)).toFixed(3));
    const current = Number(((activePowerKw * 1000) / (voltage * powerFactor)).toFixed(2));

    const reading = {
      timestamp: now.toISOString(),
      activePowerKw,
      voltage,
      current,
      frequency,
      powerFactor,
      solarGenerationKw: solarKw,
      gridDrawKw,
      gridExportKw,
      batterySocPercent,
      batteryPowerKw,
      activeAppliancesCount: activeAppliances.length,
      isSimulated: true,
    };

    return reading;
  }

  private startBackgroundSimulation() {
    // Keep simulation alive in memory without hammering DB every second
    if (this.activeInterval) clearInterval(this.activeInterval);
    this.activeInterval = setInterval(() => {
      // Background heartbeat
    }, 5000);
  }
}

export const simulationService = new SimulationService();
