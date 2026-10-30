import { calculateBill, calculateCarbonEmissions, calculatePercentageChange, calculateBatteryBackup } from '../utils/calculations.js';
import { generateAccessToken, verifyAccessToken } from '../utils/jwt.js';

async function runTestSuite() {
  console.log('🧪 Starting Green Grid Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Slab Tariff Calculation Tests
  console.log('📦 1. Testing Electricity Tariff Calculations');
  const slabTariff = {
    type: 'SLAB',
    baseRatePerKwh: 6.5,
    fixedMonthlyCharge: 100,
    taxPercent: 10,
    slab1Limit: 100,
    slab1Rate: 4.0,
    slab2Limit: 200,
    slab2Rate: 6.0,
    slab3Rate: 8.0,
  };

  // 50 kWh: 50 * 4.0 = 200 + 100 fixed = 300 + 10% tax = 330
  const bill1 = calculateBill(50, slabTariff);
  assert(bill1.energyCharges === 200, 'Slab 1 energy charges calculated correctly');
  assert(bill1.totalBill === 330, 'Slab 1 total bill with fixed charges & tax calculated correctly');

  // 150 kWh: (100 * 4) + (50 * 6) = 400 + 300 = 700 + 100 = 800 + 80 = 880
  const bill2 = calculateBill(150, slabTariff);
  assert(bill2.energyCharges === 700, 'Slab 2 energy charges calculated correctly');
  assert(bill2.totalBill === 880, 'Slab 2 total bill calculated correctly');

  // 2. Carbon Footprint Calculation Tests
  console.log('\n🌱 2. Testing Carbon Emission Calculations');
  const carbon = calculateCarbonEmissions(100);
  assert(carbon.emissionsKg === 82.0, 'Grid carbon emissions calculated at 0.82 kg/kWh');
  assert(carbon.treesEquivalent > 0, 'Tree equivalent offset calculated');

  // 3. Trend & Percentage Delta Tests
  console.log('\n📊 3. Testing Trend and Delta Analysis');
  const trendDown = calculatePercentageChange(90, 100);
  assert(trendDown.changePercent === -10, 'Decrease percentage calculated correctly');
  assert(!trendDown.isIncrease, 'Identified as decrease correctly');

  const trendUp = calculatePercentageChange(125, 100);
  assert(trendUp.changePercent === 25, 'Increase percentage calculated correctly');
  assert(trendUp.isIncrease, 'Identified as increase correctly');

  // 4. Battery Backup Estimation Tests
  console.log('\n🔋 4. Testing Battery Runtime Estimation');
  // 10 kWh battery at 50% = 5 kWh usable. At 1 kW load = 5 hours.
  const backup = calculateBatteryBackup(10.0, 50.0, 1.0);
  assert(backup === 5.0, 'Battery backup hours calculated accurately given load');

  // 5. JWT Authentication Token Security Tests
  console.log('\n🔐 5. Testing JWT Token Issuance & Verification');
  const payload = { userId: 'user-123-test', email: 'test@greengrid.io', role: 'USER' };
  const token = generateAccessToken(payload);
  assert(typeof token === 'string' && token.length > 20, 'JWT token string generated');
  const decoded = verifyAccessToken(token);
  assert(decoded.userId === payload.userId && decoded.email === payload.email, 'Decoded token matches original payload');

  console.log(`\n========================================`);
  console.log(`🎯 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
