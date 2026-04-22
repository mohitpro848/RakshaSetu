
-- Destructive/write functions: remove PUBLIC grant, only authenticated users
REVOKE EXECUTE ON FUNCTION public.create_tracking_session(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.end_tracking_session_by_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.post_location_update(text, double precision, double precision, double precision) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_tracking_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_tracking_session_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_location_update(text, double precision, double precision, double precision) TO authenticated;

-- Read functions: keep accessible to anon viewers of shared links
GRANT EXECUTE ON FUNCTION public.get_tracking_session_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_updates_by_code(text) TO anon, authenticated;
