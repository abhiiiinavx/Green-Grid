import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import energyRoutes from './energy.routes.js';
import applianceRoutes from './appliance.routes.js';
import analyticsRoutes from './analytics.routes.js';
import billingRoutes from './billing.routes.js';
import forecastRoutes from './forecast.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import alertRoutes from './alert.routes.js';
import goalRoutes from './goal.routes.js';
import solarRoutes from './solar.routes.js';
import batteryRoutes from './battery.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import reportRoutes from './report.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/energy', energyRoutes);
apiRouter.use('/appliances', applianceRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/forecasts', forecastRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/alerts', alertRoutes);
apiRouter.use('/goals', goalRoutes);
apiRouter.use('/solar', solarRoutes);
apiRouter.use('/battery', batteryRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/reports', reportRoutes);

export default apiRouter;
