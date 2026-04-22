
-- 1. Drop overly permissive policy on buddy_sessions (participant-scoped policy remains)
DROP POLICY IF EXISTS "Anyone can view session by code" ON public.buddy_sessions;

-- Add a SECURITY DEFINER function so users can look up a session by code (needed to join)
CREATE OR REPLACE FUNCTION public.get_buddy_session_by_code(_code text)
RETURNS SETOF public.buddy_sessions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.buddy_sessions
  WHERE session_code = _code AND status = 'waiting'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_buddy_session_by_code(text) TO authenticated;

-- 2. Restrict live_tracking_sessions: drop blanket SELECT/UPDATE policies
DROP POLICY IF EXISTS "Anyone can view tracking sessions" ON public.live_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can update tracking sessions" ON public.live_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can view location updates" ON public.live_location_updates;

-- SECURITY DEFINER functions for code-based access (the session_code is the share secret)
CREATE OR REPLACE FUNCTION public.get_tracking_session_by_code(_code text)
RETURNS TABLE (
  id uuid,
  session_code text,
  is_active boolean,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, session_code, is_active, started_at, ended_at, created_at
  FROM public.live_tracking_sessions
  WHERE session_code = _code
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_location_updates_by_code(_code text)
RETURNS TABLE (
  id uuid,
  session_id uuid,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lu.id, lu.session_id, lu.latitude, lu.longitude, lu.accuracy, lu.created_at
  FROM public.live_location_updates lu
  JOIN public.live_tracking_sessions lts ON lts.id = lu.session_id
  WHERE lts.session_code = _code
  ORDER BY lu.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.end_tracking_session_by_code(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.live_tracking_sessions
  SET is_active = false, ended_at = now()
  WHERE session_code = _code AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_tracking_session_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_updates_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.end_tracking_session_by_code(text) TO anon, authenticated;

-- Keep INSERT policies as-is for anonymous tracking creation/updates (feature requirement)

-- 3. Storage: require authentication for incident-photos and evidence-uploads INSERT
DROP POLICY IF EXISTS "Anyone can upload incident photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload incident photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload evidence" ON storage.objects;

CREATE POLICY "Authenticated users can upload incident photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'incident-photos');

CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evidence-uploads');
