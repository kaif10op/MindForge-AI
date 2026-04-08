-- ============================================
-- MindForge AI — Notes Enhancement Migration
-- ============================================
-- Safe to re-run (idempotent)

-- 1. Add is_pinned column to notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 2. Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own tags" ON public.tags;
CREATE POLICY "Users can CRUD own tags"
  ON public.tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Notes-Tags junction table
CREATE TABLE IF NOT EXISTS public.note_tags (
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own note_tags" ON public.note_tags;
CREATE POLICY "Users can manage own note_tags"
  ON public.note_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.notes WHERE id = note_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes WHERE id = note_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- DONE!
-- ============================================
