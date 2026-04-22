-- Drop the open insert policies; we'll funnel writes through SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Anyone can create tracking sessions" ON public.live_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can create location updates" ON public.live_location_updates;

-- RPC: create a tracking session by code (returns the row)
CREATE OR REPLACE FUNCTION public.create_tracking_session(_code text)
RETURNS TABLE (
  id uuid,
  session_code text,
  is_active boolean,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF _code IS NULL OR length(_code) < 4 OR length(_code) > 32 THEN
    RAISE EXCEPTION 'Invalid session code';
  END IF;

  INSERT INTO public.live_tracking_sessions (session_code)
  VALUES (_code)
  RETURNING live_tracking_sessions.id INTO v_id;

  RETURN QUERY
  SELECT lts.id, lts.session_code, lts.is_active, lts.started_at, lts.ended_at, lts.created_at
  FROM public.live_tracking_sessions lts
  WHERE lts.id = v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tracking_session(text) TO anon, authenticated;

-- RPC: post a location update for a session by code
CREATE OR REPLACE FUNCTION public.post_location_update(
  _code text,
  _lat double precision,
  _lng double precision,
  _accuracy double precision DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  SELECT id INTO v_session_id
  FROM public.live_tracking_sessions
  WHERE session_code = _code AND is_active = true
  LIMIT 1;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or inactive';
  END IF;

  IF _lat IS NULL OR _lng IS NULL OR _lat < -90 OR _lat > 90 OR _lng < -180 OR _lng > 180 THEN
    RAISE EXCEPTION 'Invalid coordinates';
  END IF;

  INSERT INTO public.live_location_updates (session_id, latitude, longitude, accuracy)
  VALUES (v_session_id, _lat, _lng, _accuracy);
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_location_update(text, double precision, double precision, double precision) TO anon, authenticated;