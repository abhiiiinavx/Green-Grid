import { Router } from 'express';
import * as alertController from '../controllers/alert.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', alertController.getAlerts);
router.post('/simulate', alertController.simulateAlert);
router.post('/:id/read', alertController.markAlertAsRead);
router.post('/:id/dismiss', alertController.dismissAlert);

export default router;

