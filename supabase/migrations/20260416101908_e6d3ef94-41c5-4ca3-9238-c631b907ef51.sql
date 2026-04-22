
-- Create enums
CREATE TYPE public.incident_category AS ENUM ('harassment', 'theft', 'unsafe_area', 'stalking', 'assault', 'other');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.incident_status AS ENUM ('pending', 'verified', 'resolved');

-- incident_reports
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category public.incident_category NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  status public.incident_status NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  reporter_name TEXT,
  photo_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view incident reports"
  ON public.incident_reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create incident reports"
  ON public.incident_reports FOR INSERT
  WITH CHECK (true);

-- evidence_files
CREATE TABLE public.evidence_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  session_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view evidence files"
  ON public.evidence_files FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create evidence files"
  ON public.evidence_files FOR INSERT
  WITH CHECK (true);

-- live_tracking_sessions
CREATE TABLE public.live_tracking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_tracking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tracking sessions"
  ON public.live_tracking_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create tracking sessions"
  ON public.live_tracking_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tracking sessions"
  ON public.live_tracking_sessions FOR UPDATE
  USING (true);

-- live_location_updates
CREATE TABLE public.live_location_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_tracking_sessions(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view location updates"
  ON public.live_location_updates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create location updates"
  ON public.live_location_updates FOR INSERT
  WITH CHECK (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-photos', 'incident-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence-uploads', 'evidence-uploads', true);

CREATE POLICY "Public read access for incident photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'incident-photos');

CREATE POLICY "Anyone can upload incident photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'incident-photos');

CREATE POLICY "Public read access for evidence uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence-uploads');

CREATE POLICY "Anyone can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evidence-uploads');

-- Enable realtime for incident_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_reports;
