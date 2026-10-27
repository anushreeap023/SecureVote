const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const { csrfProtection } = require('./middleware/csrf');
const errorHandler = require('./middleware/error-handler');

// Route modules
const authRoutes = require('./routes/auth.routes');
const electionsRoutes = require('./routes/elections.routes');
const candidatesRoutes = require('./routes/candidates.routes');
const votingRoutes = require('./routes/voting.routes');
const resultsRoutes = require('./routes/results.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// CORS
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || 'securevote_educational_sim_super_secure_random_key_2026_demo';
app.use(
  session({
    name: 'securevote.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    }
  })
);

// Initialize CSRF token and set XSRF-TOKEN cookie on all requests
app.use((req, res, next) => {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  if (req.session?.csrfToken) {
    res.cookie('XSRF-TOKEN', req.session.csrfToken, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  }
  next();
});

// Static frontend files with no-store for HTML, JS, CSS & JSON files
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));
app.use('/locales', express.static(path.join(__dirname, '../locales'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Direct logout shortcuts (both GET and POST redirect to auth logout)
app.get('/logout', (req, res) => res.redirect('/api/auth/logout'));
app.post('/logout', (req, res) => res.redirect(307, '/api/auth/logout'));

// CSRF Protection on API state-changing methods
app.use('/api', csrfProtection);

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api', votingRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin', adminRoutes);

// Educational status endpoint
app.get('/api/system/status', (req, res) => {
  res.json({
    name: 'SecureVote Prototype',
    type: 'Educational Simulation',
    version: '1.0.0',
    serverTime: new Date().toISOString(),
    tamperEvidentChain: 'SHA-256',
    status: 'OPERATIONAL'
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
