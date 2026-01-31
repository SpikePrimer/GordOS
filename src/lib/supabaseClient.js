/**
 * Supabase client for GordOS / cycle-login.
 * - With Vite: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.
 * - In browser (cycle-login): URL/key can also come from cycle-login/config.js (window.CYCLE_LOGIN_*).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof window !== 'undefined' && window.CYCLE_LOGIN_SUPABASE_URL) ||
  'https://YOUR_PROJECT_REF.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof window !== 'undefined' && window.CYCLE_LOGIN_SUPABASE_ANON_KEY) ||
  'sb_publishable_w8qsF695lucR488qivLbTw_tSCnaHcu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
