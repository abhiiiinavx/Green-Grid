import { Router } from 'express';
import * as energyController from '../controllers/energy.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { liveReadingSchema } from '../validators/energy.validator.js';

const router = Router();

router.use(authenticateToken);

router.get('/live', energyController.getLiveReading);
router.post('/simulation/toggle', energyController.toggleSimulation);
router.get('/readings', energyController.getRecentReadings);
router.post('/ingest', validate(liveReadingSchema), energyController.ingestReading);

export default router;
