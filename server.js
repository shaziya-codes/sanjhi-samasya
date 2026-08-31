// server.js — entry point
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

require('./database'); // ensures tables exist on boot

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set. Copy .env.example to .env and set a real secret before deploying.');
}

app.use(cors());
app.use(express.json());

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ---- Serve the frontend (static files) ----
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// Fallback: any non-API GET request returns index.html (simple SPA-style routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Sanjhi Samasya server running at http://localhost:${PORT}`);
});
