
-- =========================================================
-- 1) incident_reports: require auth to read; keep open insert
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view incident reports" ON public.incident_reports;

CREATE POLICY "Authenticated users can view incident reports"
ON public.incident_reports
FOR SELECT
TO authenticated
USING (true);

-- Safe view that hides reporter_name unless the report is anonymous-flagged
-- (anonymous=true means reporter_name is null/safe; non-anonymous hides the name from public reads)
CREATE OR REPLACE VIEW public.incident_reports_safe
WITH (security_invoker = on) AS
SELECT
  id,
  category,
  severity,
  status,
  description,
  latitude,
  longitude,
  address,
  is_anonymous,
  CASE WHEN is_anonymous THEN NULL ELSE NULL END AS reporter_name, -- never expose names via this view
  photo_url,
  video_url,
  created_at,
  updated_at
FROM public.incident_reports;

GRANT SELECT ON public.incident_reports_safe TO authenticated, anon;

-- =========================================================
-- 2) live_tracking_sessions + live_location_updates lockdown
--    Public share-link access continues to work via SECURITY DEFINER RPCs:
--      get_tracking_session_by_code, get_location_updates_by_code, post_location_update
-- =========================================================
DROP POLICY IF EXISTS "Authenticated can view tracking sessions" ON public.live_tracking_sessions;
DROP POLICY IF EXISTS "Authenticated can view location updates" ON public.live_location_updates;
DROP POLICY IF EXISTS "Authenticated can insert location updates for active sessions" ON public.live_location_updates;

-- No direct SELECT/INSERT/UPDATE/DELETE policies => RLS denies all direct access.
-- All reads/writes funnel through SECURITY DEFINER functions which already validate the session code.
