/**
 * Cycle Login - shared logic
 * Storage: users (username + 5 cycle codes), visitCount (global cycle), pageVisits, session
 */

const DEV_PIN = '9659829';
const STORAGE_KEYS = {
  users: 'cycle_login_users',
  visitCount: 'cycle_login_visitCount',
  pageVisits: 'cycle_login_pageVisits',
  session: 'cycle_login_session',
  devAuth: 'cycle_login_dev',
};

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.users);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getVisitCount() {
  const n = parseInt(localStorage.getItem(STORAGE_KEYS.visitCount) || '0', 10);
  return isNaN(n) ? 0 : n;
}

function incrementVisitCount() {
  const next = getVisitCount() + 1;
  localStorage.setItem(STORAGE_KEYS.visitCount, String(next));
  return next;
}

/** Returns current cycle 1-5 for this page visit (increments global counter). */
function getCurrentCycle() {
  const count = incrementVisitCount();
  const cycle = ((count - 1) % 5) + 1;
  return cycle;
}

/** Get current cycle without incrementing (e.g. for display after already incremented). */
function getCurrentCycleNoIncrement() {
  const count = getVisitCount();
  return ((count - 1) % 5) + 1;
}

function getPageVisits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pageVisits);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addPageVisit(entry) {
  const visits = getPageVisits();
  const ts = Date.now();
  visits.push({
    ...entry,
    timestamp: entry.timestamp != null ? entry.timestamp : ts,
    sessionStart: entry.sessionStart != null ? entry.sessionStart : (entry.type === 'app' ? ts : undefined),
  });
  localStorage.setItem(STORAGE_KEYS.pageVisits, JSON.stringify(visits));
}

/** Update the most recent app visit for this user with duration (call on page unload). */
function updateLastVisitDuration(username, durationMs) {
  const visits = getPageVisits();
  const userVisits = visits.filter((v) => v.username === username && (v.type === 'app' || v.sessionStart != null));
  if (userVisits.length === 0) return;
  userVisits.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const last = userVisits[0];
  const idx = visits.indexOf(last);
  if (idx === -1) return;
  visits[idx] = { ...last, durationMs: Math.round(durationMs) };
  localStorage.setItem(STORAGE_KEYS.pageVisits, JSON.stringify(visits));
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(username) {
  sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ username, at: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEYS.session);
}

function setDevAuth() {
  sessionStorage.setItem(STORAGE_KEYS.devAuth, '1');
}

function isDevAuth() {
  return sessionStorage.getItem(STORAGE_KEYS.devAuth) === '1';
}

function clearDevAuth() {
  sessionStorage.removeItem(STORAGE_KEYS.devAuth);
}

function generateCycleCodes() {
  const codes = [];
  for (let i = 0; i < 5; i++) {
    codes.push(String(Math.floor(1000000 + Math.random() * 9000000)));
  }
  return codes;
}

function createUser(username) {
  const users = getUsers();
  if (users.some((u) => u.username.toLowerCase() === String(username).trim().toLowerCase())) {
    return { ok: false, error: 'Username already exists' };
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
  return { ok: true, cycleCodes };
}

function deleteUser(id) {
  const users = getUsers().filter((u) => u.id !== id);
  setUsers(users);
}

function findUserByUsername(username) {
  return getUsers().find((u) => u.username.toLowerCase() === String(username).trim().toLowerCase()) || null;
}

function getUserById(id) {
  return getUsers().find((u) => u.id === id) || null;
}

function setUserLicense(userId, expiresAt) {
  const users = getUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  u.licenseExpiresAt = expiresAt == null ? null : Number(expiresAt);
  setUsers(users);
  return true;
}

/** Reduce license by X days. If result is in the past, sets license to null. */
function removeLicenseDays(userId, days) {
  const users = getUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  if (u.licenseExpiresAt == null) return true;
  const ms = days * 24 * 60 * 60 * 1000;
  const newExpiry = u.licenseExpiresAt - ms;
  u.licenseExpiresAt = newExpiry <= Date.now() ? null : newExpiry;
  setUsers(users);
  return true;
}

function isLicenseExpired(user) {
  if (!user || user.licenseExpiresAt == null) return true;
  return Date.now() >= user.licenseExpiresAt;
}

function getLicenseRemainingMs(user) {
  if (!user || user.licenseExpiresAt == null) return 0;
  const remaining = user.licenseExpiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

function formatLicenseRemaining(ms) {
  if (ms <= 0) return 'Expired';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return d + ' day' + (d !== 1 ? 's' : '') + (h > 0 ? ', ' + h + ' hr' + (h !== 1 ? 's' : '') : '');
  if (h > 0) return h + ' hr' + (h !== 1 ? 's' : '') + (m > 0 ? ', ' + m + ' min' : '');
  return m + ' min' + (m !== 1 ? 's' : '');
}

/**
 * Validate login: PIN must match current cycle's code for that user.
 * Returns { ok, error?, dev? }.
 */
function validateLogin(username, pin, currentCycle) {
  if (pin === DEV_PIN) return { ok: true, dev: true };
  const user = findUserByUsername(username);
  if (!user) return { ok: false, error: 'Unknown username' };
  const cycleIndex = currentCycle - 1;
  if (cycleIndex < 0 || cycleIndex > 4) return { ok: false, error: 'Invalid cycle' };
  const correctPin = user.cycleCodes[cycleIndex];
  if (pin === correctPin) return { ok: true };
  if (user.cycleCodes.includes(pin))
    return { ok: false, error: 'Incorrect — that code is not for the current cycle.' };
  return { ok: false, error: 'Incorrect PIN.' };
}

function getVisitsByUser() {
  const visits = getPageVisits();
  const byUser = {};
  visits.forEach((v) => {
    const u = v.username || '(login page)';
    if (!byUser[u]) byUser[u] = [];
    byUser[u].push(v);
  });
  return byUser;
}
