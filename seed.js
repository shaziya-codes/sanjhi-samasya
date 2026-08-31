// db/seed.js — run once with `npm run seed` to populate demo data.
// Safe to re-run: it skips rows that already exist.

const bcrypt = require('bcryptjs');
const db = require('./database');

function upsertUser(user) {
  const exists = db.prepare('SELECT id FROM users WHERE user_id = ?').get(user.userId);
  if (exists) return exists.id;
  const hash = bcrypt.hashSync(user.password, 10);
  const info = db.prepare(
    'INSERT INTO users (user_id, name, role, password_hash) VALUES (?, ?, ?, ?)'
  ).run(user.userId, user.name, user.role, hash);
  return info.lastInsertRowid;
}

function upsertChallenge(c) {
  const exists = db.prepare('SELECT id FROM challenges WHERE public_id = ?').get(c.publicId);
  if (exists) return;
  db.prepare(`
    INSERT INTO challenges (public_id, title, domain, district, description, status, reporter_id, votes)
    VALUES (@publicId, @title, @domain, @district, @description, @status, @reporterId, @votes)
  `).run(c);
}

const demoUserId = upsertUser({
  userId: 'demo@jharkhand.gov.in',
  name: 'Demo Citizen',
  role: 'citizen',
  password: 'demo123'
});

const seedChallenges = [
  { publicId:'JH-2211', title:'No safe drinking water at govt. primary school', domain:'Water', district:'Gumla', description:'Students walk 1.2km to fetch water daily; existing hand pump has been dry since March.', status:'open', reporterId: demoUserId, votes:58 },
  { publicId:'JH-2198', title:'High dropout among girls after class 8', domain:'Education', district:'Simdega', description:'No secondary school within safe walking distance; a university team is scoping a transport pilot.', status:'progress', reporterId: demoUserId, votes:74 },
  { publicId:'JH-2183', title:'Post-harvest maize loss due to poor storage', domain:'Agriculture', district:'Lohardaga', description:'Farmers lose roughly 18% of stock to moisture damage before it reaches the market.', status:'open', reporterId: demoUserId, votes:41 },
  { publicId:'JH-2170', title:'Sub-centre lacks referral transport at night', domain:'Health', district:'Khunti', description:'Deployed a shared-ambulance dispatch app — now covering 6 sub-centres.', status:'solved', reporterId: demoUserId, votes:112 },
  { publicId:'JH-2155', title:'Irrigation canal silting blocks two villages', domain:'Water', district:'Dumka', description:'Silt build-up over 3 seasons has cut irrigated area by roughly a third.', status:'open', reporterId: demoUserId, votes:33 },
  { publicId:'JH-2140', title:'No digital attendance at anganwadi centres', domain:'Education', district:'Ranchi', description:'Manual registers make nutrition tracking unreliable; a pilot app is being tested.', status:'progress', reporterId: demoUserId, votes:29 },
];

seedChallenges.forEach(upsertChallenge);

console.log('Seed complete.');
console.log('Demo login -> User ID: demo@jharkhand.gov.in | Password: demo123');
