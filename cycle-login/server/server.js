/**
 * Cycle Login backend - stores users and visits so accounts work across devices.
 * Run: npm install && node server.js
 * Set CYCLE_LOGIN_API_URL in your frontend to this server's URL (e.g. https://your-domain.com).
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const DEV_PIN = process.env.CYCLE_LOGIN_DEV_PIN || '9659829';
const PORT = process.env.PORT || 3847;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// In-memory dev tokens: token -> expiry
const devTokens = new Map();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, defaultVal) {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getUsers() {
  return readJson(USERS_FILE, []);
}

function setUsers(users) {
  writeJson(USERS_FILE, users);
}

function getVisits() {
  return readJson(VISITS_FILE, []);
}

function setVisits(visits) {
  writeJson(VISITS_FILE, visits);
}

function getState() {
  return readJson(STATE_FILE, { visitCount: 0 });
}

function setState(state) {
  writeJson(STATE_FILE, state);
}

function generateCycleCodes() {
  const codes = [];
  for (let i = 0; i < 5; i++) {
    codes.push(String(Math.floor(1000000 + Math.random() * 9000000)));
  }
  return codes;
}

function validateDevToken(req) {
  const auth = req.headers.authorization || req.headers['x-dev-token'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || !devTokens.has(token)) return false;
  if (Date.now() > devTokens.get(token)) {
    devTokens.delete(token);
    return false;
  }
  return true;
}

const app = express();
app.use(cors());
app.use(express.json());

// Dev auth: exchange PIN for token (24h)
app.post('/api/auth/dev', (req, res) => {
  const { pin } = req.body || {};
  if (pin !== DEV_PIN) {
    return res.status(401).json({ error: 'Invalid dev PIN' });
  }
  const token = require('crypto').randomBytes(24).toString('hex');
  devTokens.set(token, Date.now() + 24 * 60 * 60 * 1000);
  res.json({ token });
});

// Public: validate login (returns licenseExpiresAt when ok so client can check license)
app.post('/api/validate', (req, res) => {
  const { username, pin, cycle } = req.body || {};
  if (pin === DEV_PIN) return res.json({ ok: true, dev: true });
  const users = getUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).trim().toLowerCase());
  if (!user) return res.json({ ok: false, error: 'Unknown username' });
  const idx = (Number(cycle) || 1) - 1;
  if (idx < 0 || idx > 4) return res.json({ ok: false, error: 'Invalid cycle' });
  const correctPin = user.cycleCodes[idx];
  if (pin === correctPin) return res.json({ ok: true, licenseExpiresAt: user.licenseExpiresAt ?? null });
  if (user.cycleCodes.includes(pin)) {
    return res.json({ ok: false, error: 'Incorrect — that code is not for the current cycle.' });
  }
  res.json({ ok: false, error: 'Incorrect PIN.' });
});

// Public: increment visit count, return new cycle
app.post('/api/visit-count/inc', (req, res) => {
  const state = getState();
  state.visitCount = (state.visitCount || 0) + 1;
  setState(state);
  const count = state.visitCount;
  const cycle = ((count - 1) % 5) + 1;
  res.json({ count, cycle });
});

// Public: get visit count
app.get('/api/visit-count', (req, res) => {
  const state = getState();
  res.json({ count: state.visitCount || 0 });
});

// Public: add page visit
app.post('/api/visits', (req, res) => {
  const visits = getVisits();
  const entry = req.body || {};
  const ts = Date.now();
  visits.push({
    ...entry,
    timestamp: entry.timestamp != null ? entry.timestamp : ts,
    sessionStart: entry.sessionStart != null ? entry.sessionStart : (entry.type === 'app' ? ts : undefined),
  });
  setVisits(visits);
  res.status(201).json({ ok: true });
});

// Public: update last visit duration
app.patch('/api/visits/last-duration', (req, res) => {
  const { username, durationMs } = req.body || {};
  const visits = getVisits();
  const userVisits = visits.filter((v) => v.username === username && (v.type === 'app' || v.sessionStart != null));
  if (userVisits.length === 0) return res.json({ ok: true });
  userVisits.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const last = userVisits[0];
  const idx = visits.indexOf(last);
  if (idx === -1) return res.json({ ok: true });
  visits[idx] = { ...last, durationMs: Math.round(Number(durationMs) || 0) };
  setVisits(visits);
  res.json({ ok: true });
});

// --- Dev-only below ---

// GET users
app.get('/api/users', (req, res) => {
  if (!validateDevToken(req)) return res.status(401).json({ error: 'Dev auth required' });
  res.json(getUsers());
});

// POST create user
app.post('/api/users', (req, res) => {
  if (!validateDevToken(req)) return res.status(401).json({ error: 'Dev auth required' });
  const { username } = req.body || {};
  const users = getUsers();
  if (users.some((u) => u.username.toLowerCase() === String(username).trim().toLowerCase())) {
    return res.status(400).json({ ok: false, error: 'Username already exists' });
  }
  const cycleCodes = generateCycleCodes();
  users.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    username: String(username).trim(),
    cycleCodes,
    createdAt: Date.now(),
    licenseExpiresAt: null,
  });
  setUsers(users);
  res.status(201).json({ ok: true, cycleCodes });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  if (!validateDevToken(req)) return res.status(401).json({ error: 'Dev auth required' });
  const users = getUsers().filter((u) => u.id !== req.params.id);
  setUsers(users);
  res.json({ ok: true });
});

// PATCH user license
app.patch('/api/users/:id/license', (req, res) => {
  if (!validateDevToken(req)) return res.status(401).json({ error: 'Dev auth required' });
  const users = getUsers();
  const u = users.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  const { expiresAt, removeDays, addDays } = req.body || {};
  if (expiresAt !== undefined) {
    u.licenseExpiresAt = expiresAt == null ? null : Number(expiresAt);
  }
  if (removeDays != null && removeDays > 0) {
    if (u.licenseExpiresAt != null) {
      const ms = removeDays * 24 * 60 * 60 * 1000;
      const newExpiry = u.licenseExpiresAt - ms;
      u.licenseExpiresAt = newExpiry <= Date.now() ? null : newExpiry;
    }
  }
  if (addDays != null && addDays > 0) {
    const ms = addDays * 24 * 60 * 60 * 1000;
    const base = u.licenseExpiresAt != null && u.licenseExpiresAt > Date.now() ? u.licenseExpiresAt : Date.now();
    u.licenseExpiresAt = base + ms;
  }
  setUsers(users);
  res.json({ ok: true });
});

// POST bulk add license days
app.post('/api/users/bulk-add-license', (req, res) => {
  if (!validateDevToken(req)) return res.status(401).json({ error: 'Dev auth required' });
  const { days } = req.body || {};
  const d = Number(days) || 30;
  const users = getUsers();
  let count = 0;
  const ms = d * 24 * 60 * 60 * 1000;
  users.forEach((u) => {
    if (u.licenseExpiresAt != null && u.licenseExpiresAt > Date.now()) {
      u.licenseExpiresAt += ms;
      count++;
    }
  });
  if (count > 0) setUsers(users);
  res.json({ ok: true, count });
});

// GET visits
app.get('/api/visits', (req, res) => {
  if (!validateDevToken(req)) return res.status(401).json({ error: 'Dev auth required' });
  res.json(getVisits());
});

// POST reset visit count
app.post('/api/visit-count/reset', (req, res) => {
  if (!validateDevToken(req)) return res.status(401).json({ error: 'Dev auth required' });
  setState({ visitCount: 0 });
  res.json({ ok: true });
});

ensureDataDir();
app.listen(PORT, () => {
  console.log('Cycle Login server at http://localhost:' + PORT);
  console.log('Set CYCLE_LOGIN_API_URL to this URL in your frontend for cross-device accounts.');
});
