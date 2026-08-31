// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();

const VALID_ROLES = ['citizen', 'university', 'industry'];

function signToken(user) {
  return jwt.sign(
    { id: user.id, userId: user.user_id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  return { id: user.id, userId: user.user_id, name: user.name, role: user.role };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, userId, password, role } = req.body || {};

  if (!name || !userId || !password || !role) {
    return res.status(400).json({ error: 'Name, User ID, password and role are all required.' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be citizen, university or industry.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE user_id = ?').get(userId.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that User ID already exists.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (user_id, name, role, password_hash) VALUES (?, ?, ?, ?)'
  ).run(userId.trim().toLowerCase(), name.trim(), role, hash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { userId, password } = req.body || {};

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'No account matches that User ID and password.' });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'No account matches that User ID and password.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me — used by the frontend to validate a stored token on page load
router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
