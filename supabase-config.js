// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
// Replace these two values with your actual Supabase project credentials.
// Find them at: https://supabase.com → Your Project → Settings → API

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";   // ← REPLACE
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";              // ← REPLACE

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
