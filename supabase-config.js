// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
// Replace these two values with your actual Supabase project credentials.
// Find them at: https://supabase.com → Your Project → Settings → API

const SUPABASE_URL = "https://iqgqpwbfnrbmtvbpgrlv.supabase.co";   // ← REPLACE
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ3Fwd2JmbnJibXR2YnBncmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDI1NDgsImV4cCI6MjA5MjE3ODU0OH0.A0fSGwitk2aSPDwUzsarOqnI1x9t6vTbt4cePAnhhQQ";              // ← REPLACE
                      
window._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

