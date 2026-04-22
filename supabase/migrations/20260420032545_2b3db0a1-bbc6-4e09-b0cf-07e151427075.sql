-- SOS / "I Feel Unsafe" alert log
CREATE TABLE public.sos_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  alert_type text NOT NULL DEFAULT 'feel_unsafe',
  message text NOT NULL DEFAULT 'User feels unsafe',
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  tracking_session_code text,
  contacts_notified_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own SOS alerts"
ON public.sos_alerts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own SOS alerts"
ON public.sos_alerts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOS alerts"
ON public.sos_alerts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_sos_alerts_user_created
  ON public.sos_alerts (user_id, created_at DESC);