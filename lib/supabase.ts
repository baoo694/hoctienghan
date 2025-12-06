import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

