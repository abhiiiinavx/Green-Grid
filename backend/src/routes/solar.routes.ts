import { Router } from 'express';
import * as solarController from '../controllers/solar.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

router.get('/', solarController.getSolarDetails);
router.put('/', logAudit('SOLAR_UPDATED'), solarController.updateSolarSystem);

export default router;
