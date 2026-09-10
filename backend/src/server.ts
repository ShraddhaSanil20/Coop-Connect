import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { initDatabase } from './db';
import authRoutes from './routes/authRoutes';
import workerRoutes from './routes/workerRoutes';
import bookingRoutes from './routes/bookingRoutes';
import dispatchRoutes from './routes/dispatchRoutes';
import coopRoutes from './routes/coopRoutes';
import governanceRoutes from './routes/governanceRoutes';
import welfareRoutes from './routes/welfareRoutes';
import safetyRoutes from './routes/safetyRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for local dev map scripts & unsplash images
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize SQLite database and seed demo data
initDatabase();

// API Router Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/cooperative', coopRoutes);
app.use('/api/v1/governance', governanceRoutes);
app.use('/api/v1/welfare', welfareRoutes);
app.use('/api/v1/safety', safetyRoutes);

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Coop Connect API Engine',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🚀 COOP CONNECT API SERVER RUNNING ON PORT ${PORT}`);
  console.log(`  🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`=======================================================`);
});
