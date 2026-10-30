import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/export', reportController.exportReportData);

export default router;
