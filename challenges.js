// routes/challenges.js
const express = require('express');
const db = require('./database');
const { requireAuth, attachUserIfPresent } = require('./auth');

const router = express.Router();

function nextPublicId() {
  const row = db.prepare('SELECT COUNT(*) AS n FROM challenges').get();
  return 'JH-' + (2300 + row.n + 1);
}

// GET /api/challenges?domain=Water&status=open
router.get('/', attachUserIfPresent, (req, res) => {
  const { domain, status } = req.query;

  let sql = `
    SELECT c.public_id AS id, c.title, c.domain, c.district, c.description,
           c.status, c.votes, c.created_at, u.name AS reporterName
    FROM challenges c
    LEFT JOIN users u ON u.id = c.reporter_id
    WHERE 1=1
  `;
  const params = [];
  if (domain && domain !== 'all') { sql += ' AND c.domain = ?'; params.push(domain); }
  if (status) { sql += ' AND c.status = ?'; params.push(status); }
  sql += ' ORDER BY c.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ challenges: rows });
});

// POST /api/challenges  (requires login)
router.post('/', requireAuth, (req, res) => {
  const { title, domain, district, description } = req.body || {};
  if (!title || !domain || !district || !description) {
    return res.status(400).json({ error: 'Title, domain, district and description are all required.' });
  }

  const publicId = nextPublicId();
  db.prepare(`
    INSERT INTO challenges (public_id, title, domain, district, description, status, reporter_id, votes)
    VALUES (?, ?, ?, ?, ?, 'open', ?, 1)
  `).run(publicId, title.trim(), domain.trim(), district.trim(), description.trim(), req.user.id);

  // Reporter's own submission counts as the first upvote.
  const challengeRow = db.prepare('SELECT id FROM challenges WHERE public_id = ?').get(publicId);
  db.prepare('INSERT OR IGNORE INTO votes (challenge_id, user_id) VALUES (?, ?)')
    .run(challengeRow.id, req.user.id);

  const created = db.prepare(`
    SELECT c.public_id AS id, c.title, c.domain, c.district, c.description,
           c.status, c.votes, c.created_at, u.name AS reporterName
    FROM challenges c LEFT JOIN users u ON u.id = c.reporter_id
    WHERE c.public_id = ?
  `).get(publicId);

  res.status(201).json({ challenge: created });
});

// POST /api/challenges/:id/upvote  (requires login, one vote per user per challenge)
router.post('/:id/upvote', requireAuth, (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE public_id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

  try {
    db.prepare('INSERT INTO votes (challenge_id, user_id) VALUES (?, ?)').run(challenge.id, req.user.id);
  } catch (err) {
    return res.status(409).json({ error: 'You already upvoted this challenge.' });
  }

  db.prepare('UPDATE challenges SET votes = votes + 1 WHERE id = ?').run(challenge.id);
  const updated = db.prepare('SELECT votes FROM challenges WHERE id = ?').get(challenge.id);

  res.json({ id: challenge.public_id, votes: updated.votes });
});

module.exports = router;
