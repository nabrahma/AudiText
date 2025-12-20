// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Edge Function URLs and API Key
export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
export const ANON_KEY = supabaseAnonKey
