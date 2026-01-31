/**
 * Quick Node test for Supabase. Run: node supabase-test.mjs
 * Reads .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 * Uses cycle_state; change table name if needed.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = join(__dirname, '.env.local');
    const content = readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co';
const key = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_w8qsF695lucR488qivLbTw_tSCnaHcu';
const supabase = createClient(url, key);

const { data, error } = await supabase.from('cycle_state').select('*').limit(1);
if (error) console.error('Supabase error:', error);
else console.log('Result:', data);
