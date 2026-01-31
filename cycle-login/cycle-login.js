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

function resetVisitCount() {
  localStorage.setItem(STORAGE_KEYS.visitCount, '0');
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

function setSession(username, licenseExpiresAt) {
  sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ username, at: Date.now(), licenseExpiresAt: licenseExpiresAt != null ? licenseExpiresAt : undefined }));
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

/** Add X days to all users who currently have a non-expired license. */
function bulkAddLicenseDays(days) {
  const users = getUsers();
  let count = 0;
  const ms = days * 24 * 60 * 60 * 1000;
  users.forEach((u) => {
    if (u.licenseExpiresAt != null && u.licenseExpiresAt > Date.now()) {
      u.licenseExpiresAt += ms;
      count++;
    }
  });
  if (count > 0) setUsers(users);
  return count;
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

// --- Remote storage (cross-device): Supabase OR Node API ---
const DEV_TOKEN_KEY = 'cycle_login_dev_token';

function getApiUrl() {
  try {
    const u = typeof window !== 'undefined' && window.CYCLE_LOGIN_API_URL;
    return u ? String(window.CYCLE_LOGIN_API_URL).replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

function getSupabaseUrl() {
  try {
    const u = typeof window !== 'undefined' && window.CYCLE_LOGIN_SUPABASE_URL;
    return u ? String(window.CYCLE_LOGIN_SUPABASE_URL).replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

function getSupabaseAnonKey() {
  try {
    return (typeof window !== 'undefined' && window.CYCLE_LOGIN_SUPABASE_ANON_KEY) ? String(window.CYCLE_LOGIN_SUPABASE_ANON_KEY) : '';
  } catch {
    return '';
  }
}

function useSupabase() {
  return getSupabaseUrl() && getSupabaseAnonKey();
}

function useRemoteStorage() {
  return useSupabase() || getApiUrl();
}

async function supabaseFetch(method, path, body) {
  const base = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!base || !key) throw new Error('Supabase not configured');
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: 'Bearer ' + key,
      Prefer: 'return=representation',
    },
  };
  if (body != null && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(base + path, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}

function getDevToken() {
  try {
    return sessionStorage.getItem(DEV_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setDevToken(token) {
  try {
    if (token) sessionStorage.setItem(DEV_TOKEN_KEY, token);
    else sessionStorage.removeItem(DEV_TOKEN_KEY);
  } catch (_) {}
}

async function apiRequest(method, path, body, useDevToken) {
  const base = getApiUrl();
  if (!base) return null;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (useDevToken && getDevToken()) opts.headers['Authorization'] = 'Bearer ' + getDevToken();
  if (body != null && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(base + path, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}

async function getCurrentCycleAsync() {
  if (useSupabase()) {
    const state = await supabaseFetch('GET', '/rest/v1/cycle_state?key=eq.visit_count&select=value');
    let count = (state && state[0] && state[0].value != null) ? Number(state[0].value) : 0;
    count += 1;
    if (state && state[0]) {
      await supabaseFetch('PATCH', '/rest/v1/cycle_state?key=eq.visit_count', { value: count });
    } else {
      await supabaseFetch('POST', '/rest/v1/cycle_state', { key: 'visit_count', value: count });
    }
    return ((count - 1) % 5) + 1;
  }
  const data = await apiRequest('POST', '/api/visit-count/inc', null, false);
  return data ? data.cycle : 1;
}

async function addPageVisitAsync(entry) {
  const ts = entry.timestamp || Date.now();
  const row = { username: entry.username || null, type: entry.type || null, referrer: entry.referrer || '', cycle: entry.cycle || null, timestamp: ts, duration_ms: entry.durationMs || null, session_start: entry.sessionStart || (entry.type === 'app' ? ts : null) };
  if (useSupabase()) {
    await supabaseFetch('POST', '/rest/v1/cycle_visits', row);
    return;
  }
  await apiRequest('POST', '/api/visits', { ...entry, timestamp: ts, sessionStart: entry.sessionStart }, false);
}

async function validateLoginAsync(username, pin, currentCycle) {
  if (useSupabase()) {
    try {
      const res = await supabaseFetch('GET', '/rest/v1/cycle_users?username=ilike.' + encodeURIComponent(username.trim()) + '&select=*');
      const users = Array.isArray(res) ? res : [];
      const user = users[0];
      if (!user) return { ok: false, error: 'Unknown username' };
      if (pin === DEV_PIN) return { ok: true, dev: true };
      const codes = user.cycle_codes || [];
      const idx = (currentCycle - 1) | 0;
      if (idx < 0 || idx >= codes.length) return { ok: false, error: 'Invalid cycle' };
      if (pin === codes[idx]) return { ok: true, licenseExpiresAt: user.license_expires_at ?? null };
      if (codes.includes(pin)) return { ok: false, error: 'Incorrect — that code is not for the current cycle.' };
      return { ok: false, error: 'Incorrect PIN.' };
    } catch (e) {
      return { ok: false, error: 'Network error' };
    }
  }
  const data = await apiRequest('POST', '/api/validate', { username, pin, cycle: currentCycle }, false);
  return data || { ok: false, error: 'Network error' };
}

async function updateLastVisitDurationAsync(username, durationMs) {
  if (useSupabase()) {
    const res = await supabaseFetch('GET', '/rest/v1/cycle_visits?username=eq.' + encodeURIComponent(username) + '&order=timestamp.desc&limit=1&select=id');
    const rows = Array.isArray(res) ? res : [];
    if (rows.length && rows[0].id) await supabaseFetch('PATCH', '/rest/v1/cycle_visits?id=eq.' + rows[0].id, { duration_ms: Math.round(durationMs) });
    return;
  }
  await apiRequest('PATCH', '/api/visits/last-duration', { username, durationMs }, false);
}

async function getUsersAsync() {
  if (useSupabase()) {
    const res = await supabaseFetch('GET', '/rest/v1/cycle_users?select=*');
    const rows = Array.isArray(res) ? res : [];
    return rows.map(function (r) {
      return { id: r.id, username: r.username, cycleCodes: r.cycle_codes || [], createdAt: r.created_at, licenseExpiresAt: r.license_expires_at != null ? r.license_expires_at : null };
    });
  }
  const data = await apiRequest('GET', '/api/users', null, true);
  return Array.isArray(data) ? data : [];
}

async function createUserAsync(username) {
  if (useSupabase()) {
    const un = String(username).trim();
    const existing = await supabaseFetch('GET', '/rest/v1/cycle_users?username=ilike.' + encodeURIComponent(un) + '&select=id');
    if (existing && existing.length > 0) return { ok: false, error: 'Username already exists' };
    const cycleCodes = generateCycleCodes();
    const row = { username: un, cycle_codes: cycleCodes, created_at: Date.now(), license_expires_at: null };
    await supabaseFetch('POST', '/rest/v1/cycle_users', row);
    return { ok: true, cycleCodes };
  }
  return await apiRequest('POST', '/api/users', { username }, true) || { ok: false, error: 'Network error' };
}

async function deleteUserAsync(id) {
  if (useSupabase()) {
    await supabaseFetch('DELETE', '/rest/v1/cycle_users?id=eq.' + encodeURIComponent(id));
    return;
  }
  await apiRequest('DELETE', '/api/users/' + encodeURIComponent(id), null, true);
}

async function getPageVisitsAsync() {
  if (useSupabase()) {
    const res = await supabaseFetch('GET', '/rest/v1/cycle_visits?select=*&order=timestamp.desc');
    const rows = Array.isArray(res) ? res : [];
    return rows.map(function (r) {
      return { username: r.username, type: r.type, referrer: r.referrer, cycle: r.cycle, timestamp: r.timestamp, durationMs: r.duration_ms, sessionStart: r.session_start };
    });
  }
  const data = await apiRequest('GET', '/api/visits', null, true);
  return Array.isArray(data) ? data : [];
}

async function setUserLicenseAsync(userId, expiresAt) {
  if (useSupabase()) {
    await supabaseFetch('PATCH', '/rest/v1/cycle_users?id=eq.' + encodeURIComponent(userId), { license_expires_at: expiresAt == null ? null : expiresAt });
    return;
  }
  await apiRequest('PATCH', '/api/users/' + encodeURIComponent(userId) + '/license', { expiresAt }, true);
}

async function removeLicenseDaysAsync(userId, days) {
  if (useSupabase()) {
    const res = await supabaseFetch('GET', '/rest/v1/cycle_users?id=eq.' + encodeURIComponent(userId) + '&select=license_expires_at');
    const rows = Array.isArray(res) ? res : [];
    const u = rows[0];
    if (!u || u.license_expires_at == null) return;
    const ms = (days | 0) * 24 * 60 * 60 * 1000;
    let newExpiry = Number(u.license_expires_at) - ms;
    if (newExpiry <= Date.now()) newExpiry = null;
    await supabaseFetch('PATCH', '/rest/v1/cycle_users?id=eq.' + encodeURIComponent(userId), { license_expires_at: newExpiry });
    return;
  }
  await apiRequest('PATCH', '/api/users/' + encodeURIComponent(userId) + '/license', { removeDays: days }, true);
}

async function bulkAddLicenseDaysAsync(days) {
  if (useSupabase()) {
    const res = await supabaseFetch('GET', '/rest/v1/cycle_users?select=id,license_expires_at');
    const rows = Array.isArray(res) ? res : [];
    const now = Date.now();
    const ms = (days | 0) * 24 * 60 * 60 * 1000;
    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.license_expires_at != null && Number(r.license_expires_at) > now) {
        await supabaseFetch('PATCH', '/rest/v1/cycle_users?id=eq.' + encodeURIComponent(r.id), { license_expires_at: Number(r.license_expires_at) + ms });
        count++;
      }
    }
    return count;
  }
  const data = await apiRequest('POST', '/api/users/bulk-add-license', { days }, true);
  return data && data.count != null ? data.count : 0;
}

async function resetVisitCountAsync() {
  if (useSupabase()) {
    try {
      await supabaseFetch('PATCH', '/rest/v1/cycle_state?key=eq.visit_count', { value: 0 });
    } catch (_) {
      await supabaseFetch('POST', '/rest/v1/cycle_state', { key: 'visit_count', value: 0 });
    }
    return;
  }
  await apiRequest('POST', '/api/visit-count/reset', null, true);
}

async function getVisitCountAsync() {
  if (useSupabase()) {
    const res = await supabaseFetch('GET', '/rest/v1/cycle_state?key=eq.visit_count&select=value');
    if (res && res[0] && res[0].value != null) return Number(res[0].value) | 0;
    return 0;
  }
  const data = await apiRequest('GET', '/api/visit-count', null, false);
  return data && data.count != null ? data.count : 0;
}

/** When using API: get current cycle without incrementing. */
async function getCurrentCycleNoIncrementAsync() {
  const count = await getVisitCountAsync();
  return ((count - 1) % 5) + 1;
}

/** Exchange dev PIN for token (Node server) or just validate PIN (Supabase). Returns true if success. */
async function apiDevAuth(pin) {
  if (pin !== DEV_PIN) return false;
  if (useSupabase()) {
    setDevAuth();
    return true;
  }
  const base = getApiUrl();
  if (!base) return false;
  try {
    const data = await apiRequest('POST', '/api/auth/dev', { pin }, false);
    if (data && data.token) {
      setDevToken(data.token);
      setDevAuth();
      return true;
    }
  } catch (_) {}
  return false;
}
