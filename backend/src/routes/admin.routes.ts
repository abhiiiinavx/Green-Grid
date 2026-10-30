import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

router.get('/overview', adminController.getAdminOverview);
router.get('/users', adminController.getAllUsers);
router.post('/users/:id/toggle-status', logAudit('ADMIN_USER_STATUS_TOGGLED'), adminController.toggleUserStatus);

export default router;
