import { Router } from 'express';
import * as billingController from '../controllers/billing.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { tariffSchema } from '../validators/tariff.validator.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

router.get('/', billingController.getBillingOverview);
router.post('/simulate', billingController.simulateBill);
router.put('/tariff', validate(tariffSchema), logAudit('TARIFF_UPDATED'), billingController.updateTariff);

export default router;
