// AudiText API Service
// Handles communication with Supabase Edge Functions

import { ANON_KEY, FUNCTIONS_URL, supabase } from './supabase'

// ============================================
// Types
// ============================================

export interface ExtractedContent {
  title: string
  content: string
  source: string
  platform: string
  word_count: number
  author?: string
  ai_cleaned?: boolean
}

export interface LibraryItem {
  id: string
  user_id: string
  url: string
  title: string | null
  content: string | null
  word_count: number
  source: string
  platform: string | null
  author: string | null
  is_favorite: boolean
  is_archived: boolean
  progress: number
  audio_url: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Content Extraction
// ============================================

export async function extractContent(url: string): Promise<ExtractedContent> {
  const response = await fetch(`${FUNCTIONS_URL}/extract-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to extract content')
  }

  const data = await response.json()
  console.log('🔍 Extracted Data (Debug):', data)
  return data
}

// ============================================
// Library Operations
// ============================================

/**
 * Ensure the user is authenticated (anonymously if needed)
 */
export async function ensureAuth() {
  // We no longer auto-sign in anonymously. 
  // Auth is now explicit.
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getLibraryItems(): Promise<LibraryItem[]> {
  await ensureAuth();
  
  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function addToLibrary(
  item: Omit<LibraryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<LibraryItem> {
  await ensureAuth();
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('library_items')
    .insert({
      ...item,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLibraryItem(
  id: string, 
  updates: Partial<LibraryItem>
): Promise<LibraryItem> {
  await ensureAuth();
  
  const { data, error } = await supabase
    .from('library_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLibraryItem(id: string): Promise<void> {
  await ensureAuth();
  
  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function clearLibrary(): Promise<void> {
  await ensureAuth();
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('user_id', user.id)

  if (error) throw error
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  await updateLibraryItem(id, { is_favorite: isFavorite })
}

export async function updateProgress(id: string, progress: number): Promise<void> {
  await updateLibraryItem(id, { progress })
}

// ============================================
// Utility: Extract only (Audio is now client-side)
// ============================================

export async function processUrl(url: string): Promise<{
  content: ExtractedContent
}> {
  // Step 1: Extract content
  const content = await extractContent(url)
  
  // Audio generation is now handled client-side in AudioContext via window.speechSynthesis
  
  return { content }
}
