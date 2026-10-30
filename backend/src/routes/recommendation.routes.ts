import { Router } from 'express';
import * as recController from '../controllers/recommendation.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

router.get('/', recController.getRecommendations);
router.post('/refresh', logAudit('RECOMMENDATIONS_REFRESHED'), recController.generateFreshRecommendations);
router.post('/:id/apply', logAudit('RECOMMENDATION_APPLIED'), recController.applyRecommendation);
router.post('/:id/dismiss', logAudit('RECOMMENDATION_DISMISSED'), recController.dismissRecommendation);

export default router;

