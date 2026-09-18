import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { testConnection } from './config/db.js';
import { initializeDatabase } from './config/initDb.js';

import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import committeeRoutes from './routes/committeeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import memberPortalRoutes from './routes/memberPortalRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), message: 'Kameti Node.js Backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/member', memberPortalRoutes);
app.use('/api/profile', profileRoutes);

// Static files for React Frontend (Production / Fullstack Deployment)
const distPath = path.resolve(__dirname, '../../react-frontend/dist');
const altDistPath = path.resolve(__dirname, '../public');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
} else if (fs.existsSync(altDistPath)) {
  app.use(express.static(altDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(altDistPath, 'index.html'));
    }
    next();
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

async function startServer() {
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.error('⚠️ Warning: Database connection failed. Please check your DB credentials / connection string.');
  } else {
    // Run schema initialization and admin seeding
    await initializeDatabase();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Kameti Server running at: http://localhost:${PORT}`);
    console.log(`📡 Serving API routes at: http://localhost:${PORT}/api`);
  });
}

startServer();

