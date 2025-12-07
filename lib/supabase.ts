import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper function to check if credentials are configured
export function hasSupabaseCredentials(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Create supabase client
// During build phase, create placeholder to allow compilation
// At runtime, create client only if credentials are available
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  // Check if we're in Next.js build phase
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.NEXT_PHASE === 'phase-development-build';
  
  if (isBuildPhase) {
    // Build time: create placeholder client to allow build to succeed
    supabase = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
    );
  } else {
    // Runtime without credentials: create a client that will fail with clear error
    // We use a clearly invalid URL to prevent any connection attempts
    console.error(
      'ERROR: Supabase credentials are not configured!\n' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
    supabase = createClient(
      'https://missing-credentials-please-configure.supabase.co',
      'missing-key-please-configure'
    );
  }
} else {
  // Create real client with actual credentials
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Database types
export interface SavedWord {
  id?: string;
  word: string;
  han_viet: string;
  meaning_in_context: string;
  explanation: string;
  context_sentence: string;
  created_at?: string;
  user_id?: string; // For future multi-user support
}

