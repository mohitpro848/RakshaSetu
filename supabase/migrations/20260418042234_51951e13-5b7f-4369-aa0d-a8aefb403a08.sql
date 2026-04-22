-- Fix INSERT policies that were created without role grants (became no-op)
DROP POLICY IF EXISTS "Anyone can create tracking sessions" ON public.live_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can create location updates" ON public.live_location_updates;

CREATE POLICY "Anyone can create tracking sessions"
  ON public.live_tracking_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can create location updates"
  ON public.live_location_updates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);