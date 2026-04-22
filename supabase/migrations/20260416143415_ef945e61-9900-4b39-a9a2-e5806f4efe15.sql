
-- Forum posts table
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'safety_tip',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view forum posts" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Forum comments table
CREATE TABLE public.forum_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comments" ON public.forum_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.forum_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.forum_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Location ratings table
CREATE TABLE public.location_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_name TEXT,
  place_name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  safety_rating INTEGER NOT NULL CHECK (safety_rating >= 1 AND safety_rating <= 5),
  lighting_rating INTEGER CHECK (lighting_rating >= 1 AND lighting_rating <= 5),
  crowd_rating INTEGER CHECK (crowd_rating >= 1 AND crowd_rating <= 5),
  review TEXT,
  visit_time TEXT DEFAULT 'day',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.location_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view ratings" ON public.location_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create ratings" ON public.location_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.location_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON public.location_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger for forum_posts updated_at
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
