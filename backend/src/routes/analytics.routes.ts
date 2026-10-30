import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', analyticsController.getAnalytics);

export default router;
