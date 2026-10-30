import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import apiV1Routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';
import { prisma } from './config/prisma.js';

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.corsOrigin === '*' ? true : [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5180', 'http://127.0.0.1:5180'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  sendSuccess(res, {
    status: 'ONLINE',
    service: 'Green Grid Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'CONNECTED',
    uptimeSeconds: Math.floor(process.uptime()),
  }, 'Green Grid API Service is operational');
});

// Mount Versioned API Routes
app.use('/api/v1', apiV1Routes);

// Centralized error handling
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 Green Grid Backend API listening on http://localhost:${config.port}`);
  console.log(`📡 Health check available at http://localhost:${config.port}/api/health`);
  console.log(`⚡ Environment: ${config.nodeEnv}`);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down Green Grid backend...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed cleanly.');
    process.exit(0);
  });
});

export default app;
