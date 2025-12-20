-- Enable RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own items
CREATE POLICY "Users can only see their own items"
ON library_items
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert items for themselves
CREATE POLICY "Users can only insert their own items"
ON library_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own items
CREATE POLICY "Users can only update their own items"
ON library_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own items
CREATE POLICY "Users can only delete their own items"
ON library_items
FOR DELETE
USING (auth.uid() = user_id);
