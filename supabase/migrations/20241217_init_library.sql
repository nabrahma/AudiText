-- ============================================
-- AudiText Database Schema - Phase 1
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create library_items table
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  word_count INT DEFAULT 0,
  source TEXT DEFAULT 'Web',
  platform TEXT, -- 'twitter', 'medium', 'substack', 'web'
  author TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  progress INT DEFAULT 0, -- 0-100 percentage
  audio_url TEXT, -- For future audio storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_library_items_user_id ON library_items(user_id);
CREATE INDEX IF NOT EXISTS idx_library_items_created_at ON library_items(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Users can only access their own items

-- SELECT: Users can view their own items
CREATE POLICY "Users can view own items" 
  ON library_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: Users can insert items for themselves
CREATE POLICY "Users can insert own items" 
  ON library_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own items
CREATE POLICY "Users can update own items" 
  ON library_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- DELETE: Users can delete their own items
CREATE POLICY "Users can delete own items" 
  ON library_items 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification: Check if table was created
-- ============================================
-- SELECT * FROM library_items LIMIT 1;
