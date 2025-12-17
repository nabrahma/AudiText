// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uivhxrlbyjtmckvnexrk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdmh4cmxieWp0bWNrdm5leHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzQxMTAsImV4cCI6MjA4MTU1MDExMH0.DNZvZam2n4YE0Q_xAxa2Ettx86xoi4cqyluCWOQ_RrY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Edge Function URLs and API Key
export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
export const ANON_KEY = supabaseAnonKey
