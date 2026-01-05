-- ============================================
-- AudiText Security Patches
-- 1. Restrict RLS to Authenticated Users
-- 2. Fix Function Search Path
-- ============================================

-- 1. Fix: Detects row level security (RLS) policies that allow access to anonymous users.
-- We explicitly restrict the policies to the 'authenticated' role.

ALTER POLICY "Users can view own items" ON library_items TO authenticated;
ALTER POLICY "Users can insert own items" ON library_items TO authenticated;
ALTER POLICY "Users can update own items" ON library_items TO authenticated;
ALTER POLICY "Users can delete own items" ON library_items TO authenticated;


-- 2. Fix: Function public.update_updated_at_column has a role mutable search_path
-- We explicitly set the search_path to 'public' to prevent malicious path injection.

ALTER FUNCTION update_updated_at_column() SET search_path = public;
