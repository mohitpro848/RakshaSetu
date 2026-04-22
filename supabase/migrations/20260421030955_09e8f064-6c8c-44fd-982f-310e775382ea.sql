
-- Drop legacy public-read policy on evidence-uploads (bucket is now private)
DROP POLICY IF EXISTS "Public read access for evidence uploads" ON storage.objects;
-- Drop duplicate INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
