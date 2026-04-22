
-- 1. Evidence files: restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Anyone can create evidence files" ON public.evidence_files;

CREATE POLICY "Authenticated users can view evidence files"
ON public.evidence_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create evidence files"
ON public.evidence_files FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Make evidence-uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'evidence-uploads';

-- Storage policies for evidence-uploads (authenticated only)
DROP POLICY IF EXISTS "Authenticated can read evidence uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload evidence" ON storage.objects;

CREATE POLICY "Authenticated can read evidence uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidence-uploads');

CREATE POLICY "Authenticated can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence-uploads');

-- 3. Live location updates - explicit policies
CREATE POLICY "Authenticated can insert location updates for active sessions"
ON public.live_location_updates FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.live_tracking_sessions s
    WHERE s.id = session_id AND s.is_active = true
  )
);

CREATE POLICY "Authenticated can view location updates"
ON public.live_location_updates FOR SELECT
TO authenticated
USING (true);

-- live_tracking_sessions: also add an authenticated SELECT policy so app can read sessions
CREATE POLICY "Authenticated can view tracking sessions"
ON public.live_tracking_sessions FOR SELECT
TO authenticated
USING (true);

-- 4. Revoke anon access to destructive RPC
REVOKE EXECUTE ON FUNCTION public.end_tracking_session_by_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.post_location_update(text, double precision, double precision, double precision) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_tracking_session(text) FROM anon;
