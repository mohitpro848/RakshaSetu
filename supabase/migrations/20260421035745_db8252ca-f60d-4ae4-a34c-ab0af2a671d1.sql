
-- Add owner column (nullable to accept legacy rows), default to auth.uid() so client inserts
-- automatically attribute the row to the signed-in user.
ALTER TABLE public.evidence_files
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS evidence_files_user_id_idx ON public.evidence_files(user_id);

-- Replace permissive SELECT policy with owner-scoped one
DROP POLICY IF EXISTS "Authenticated users can view evidence files" ON public.evidence_files;

CREATE POLICY "Users can view their own evidence files"
ON public.evidence_files
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Tighten INSERT: signed-in user, and the row must belong to them (or fall back to default)
DROP POLICY IF EXISTS "Authenticated users can create evidence files" ON public.evidence_files;

CREATE POLICY "Users can create their own evidence files"
ON public.evidence_files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
