import { Router } from 'express';
import * as notifController from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', notifController.getNotifications);
router.post('/:id/read', notifController.markNotificationAsRead);

export default router;
