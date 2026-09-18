import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { testConnection } from './config/db.js';
import { initializeDatabase } from './config/initDb.js';
import { sanitizeInputs } from './middleware/sanitize.js';

import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import committeeRoutes from './routes/committeeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import memberPortalRoutes from './routes/memberPortalRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Hide technological fingerprint
app.disable('x-powered-by');

// Security: HTTP Security Headers (XSS, Clickjacking, MIME sniffing protection)
app.use(helmet({
  contentSecurityPolicy: false, // Allows bundled SPA assets & fonts to load seamlessly
  crossOriginEmbedderPolicy: false
}));

// Security: Rate limiting to prevent brute-force attacks on login
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per IP
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Security: General API rate limiting against DDoS & scraping
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600, // Sufficient for live auction polling while preventing abuse
  message: {
    success: false,
    message: 'Too many API requests from your network. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS setup — strict origin whitelist on production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // In development (no CORS_ORIGIN set), allow all
    if (!allowedOrigins) return callback(null, true);
    // Strict whitelist check in production
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security: Payload size limits to protect from Buffer overflow / payload DDoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Security: Sanitize all inputs (XSS, script injection, prototype pollution)
app.use(sanitizeInputs);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), message: 'Kameti Node.js Backend is running' });
});

// Apply rate limiters
app.use('/api/', apiRateLimiter);
app.use('/api/auth/login', authRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/member', memberPortalRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reminders', reminderRoutes);

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

