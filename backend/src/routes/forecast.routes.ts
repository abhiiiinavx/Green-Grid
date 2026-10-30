import { Router } from 'express';
import * as forecastController from '../controllers/forecast.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', forecastController.getDailyForecast);
router.get('/hourly', forecastController.getHourlyForecast);
router.get('/daily', forecastController.getDailyForecast);
router.get('/anomalies', forecastController.getAnomalies);

export default router;
