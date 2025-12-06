import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create supabase client with fallback for build time
// This allows build to succeed even without credentials configured
let supabase: SupabaseClient;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Use placeholder values during build to prevent errors
    // These will fail at runtime if actually used, but allow build to complete
    supabase = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
    );
    if (typeof window === 'undefined') {
      // Server-side: only warn during build, not in runtime
      console.warn('Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.');
    }
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  // Fallback: create with placeholder if validation fails
  supabase = createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
  );
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

