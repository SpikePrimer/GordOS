/**
 * Cross-device accounts: choose ONE option below so logins work on any device.
 *
 * OPTION A – Supabase (no server to run, free tier):
 * 1. Go to https://supabase.com → New project.
 * 2. In SQL Editor, run the script from cycle-login/supabase-setup.sql
 * 3. In Settings → API copy Project URL and anon public key.
 * 4. Set them below.
 */
window.CYCLE_LOGIN_SUPABASE_URL = '';   // e.g. 'https://xxxxx.supabase.co'
window.CYCLE_LOGIN_SUPABASE_ANON_KEY = '';  // anon public key

/**
 * OPTION B – Your own Node server (run cycle-login/server):
 * 1. cd cycle-login/server && npm install && npm start
 * 2. Set CYCLE_LOGIN_API_URL to your server (e.g. http://localhost:3847 or https://your-app.railway.app)
 */
window.CYCLE_LOGIN_API_URL = '';  // e.g. 'http://localhost:3847'

/** If both are empty, accounts are stored only on this device. */
