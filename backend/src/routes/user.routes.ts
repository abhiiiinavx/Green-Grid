import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, onboardingSchema } from '../validators/auth.validator.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), logAudit('PROFILE_UPDATED'), userController.updateProfile);
router.post('/onboarding', validate(onboardingSchema), logAudit('ONBOARDING_COMPLETED'), userController.completeOnboarding);

export default router;
