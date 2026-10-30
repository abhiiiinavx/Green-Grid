import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:../../prisma/dev.db',
  jwt: {
    secret: process.env.JWT_SECRET || 'greengrid-super-secure-access-token-secret-key-2026-prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'greengrid-super-secure-refresh-token-secret-key-2026-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  // Emission factor: 0.82 kg CO2 per kWh (standard grid average)
  carbonEmissionFactorKgPerKwh: 0.82,
};
