
-- Create safe_zones table for geofencing
CREATE TABLE public.safe_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_contacts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.safe_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own safe zones" ON public.safe_zones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own safe zones" ON public.safe_zones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own safe zones" ON public.safe_zones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own safe zones" ON public.safe_zones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create cctv_locations table for crowdsourced CCTV map
CREATE TABLE public.cctv_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  description TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cctv_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view CCTV locations" ON public.cctv_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add CCTV locations" ON public.cctv_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own CCTV pins" ON public.cctv_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own CCTV pins" ON public.cctv_locations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_safe_zones_updated_at BEFORE UPDATE ON public.safe_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cctv_locations_updated_at BEFORE UPDATE ON public.cctv_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
