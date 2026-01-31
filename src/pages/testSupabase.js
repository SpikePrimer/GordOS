/**
 * Quick test script for Supabase client.
 * Run via your build (e.g. Vite) or use supabase-test.js in project root.
 * Uses cycle_state (from cycle-login/supabase-setup.sql); change to 'todos' if you have that table.
 */
import { supabase } from '../lib/supabaseClient.js';

async function run() {
  console.log('Testing Supabase client...');
  const { data, error } = await supabase.from('cycle_state').select('*').limit(1);
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('Result:', data);
  }
}

run();
