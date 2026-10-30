import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', dashboardController.getDashboard);
router.get('/chart', dashboardController.getDashboardChart);

export default router;
