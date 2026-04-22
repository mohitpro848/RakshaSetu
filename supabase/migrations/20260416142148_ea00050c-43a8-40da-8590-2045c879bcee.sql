
-- Create buddy_sessions table
CREATE TABLE public.buddy_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL,
  buddy_id UUID,
  creator_name TEXT,
  buddy_name TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  check_in_interval INTEGER NOT NULL DEFAULT 15,
  last_check_in TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creator_lat DOUBLE PRECISION,
  creator_lng DOUBLE PRECISION,
  buddy_lat DOUBLE PRECISION,
  buddy_lng DOUBLE PRECISION,
  destination TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create buddy_messages table
CREATE TABLE public.buddy_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.buddy_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'check_in', 'alert', 'location')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buddy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_messages ENABLE ROW LEVEL SECURITY;

-- Buddy sessions policies
CREATE POLICY "Authenticated users can create buddy sessions"
ON public.buddy_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Session participants can view their sessions"
ON public.buddy_sessions FOR SELECT TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = buddy_id);

CREATE POLICY "Session participants can update their sessions"
ON public.buddy_sessions FOR UPDATE TO authenticated
USING (auth.uid() = creator_id OR auth.uid() = buddy_id);

-- Allow anyone to view by session_code (for joining)
CREATE POLICY "Anyone can view session by code"
ON public.buddy_sessions FOR SELECT TO authenticated
USING (true);

-- Buddy messages policies
CREATE POLICY "Session participants can send messages"
ON public.buddy_messages FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.buddy_sessions
  WHERE id = session_id
  AND (creator_id = auth.uid() OR buddy_id = auth.uid())
));

CREATE POLICY "Session participants can view messages"
ON public.buddy_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.buddy_sessions
  WHERE id = session_id
  AND (creator_id = auth.uid() OR buddy_id = auth.uid())
));

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_messages;
