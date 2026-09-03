/**
 * Supabase Client Configuration for Agriswara
 */

// Helper to auto-format URL in case dashboard URL was pasted
function formatSupabaseUrl(inputUrl) {
  if (!inputUrl) return '';
  let url = inputUrl.trim();
  // If user pasted dashboard URL like: https://supabase.com/dashboard/project/sgahejpvbnpzsesoniux
  const dashboardMatch = url.match(/project\/([a-z0-9]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  // Remove trailing slash
  return url.replace(/\/+$/, '');
}

const SUPABASE_CONFIG = {
  // Project URL Supabase API yang benar (bukan link dashboard):
  url: formatSupabaseUrl('https://sgahejpvbnpzsesoniux.supabase.co'),
  
  // Anon / public API Key:
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYWhlanB2Ym5wenNlc29uaXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzU3MDQsImV4cCI6MjEwNDAxMTcwNH0.7aCB36KtLi-wDroRmvps8ZJJx7l6A5PocD77NUo9zJI'
};

// Check if valid credentials are provided
const isSupabaseConfigured = () => {
  return SUPABASE_CONFIG.url && 
         SUPABASE_CONFIG.anonKey && 
         !SUPABASE_CONFIG.url.includes('YOUR_SUPABASE_PROJECT_ID') &&
         !SUPABASE_CONFIG.anonKey.includes('YOUR_SUPABASE_ANON_KEY');
};

// Initialize Supabase Client
let supabaseClient = null;

if (typeof supabase !== 'undefined' && isSupabaseConfigured()) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('⚡ Agriswara: Supabase client connected successfully to:', SUPABASE_CONFIG.url);
  } catch (err) {
    console.warn('⚠️ Agriswara: Failed to initialize Supabase client:', err);
  }
}
