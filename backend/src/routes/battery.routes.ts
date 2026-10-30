import { Router } from 'express';
import * as batteryController from '../controllers/battery.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

router.get('/', batteryController.getBatteryDetails);
router.put('/', logAudit('BATTERY_UPDATED'), batteryController.updateBattery);

export default router;
