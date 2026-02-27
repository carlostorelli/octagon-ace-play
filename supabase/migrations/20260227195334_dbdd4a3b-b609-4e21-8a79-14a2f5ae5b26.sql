-- Add photo_url column to fighters
ALTER TABLE public.fighters ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '';

-- Create storage bucket for fighter photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fighter-photos', 'fighter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fighter photos
CREATE POLICY "Fighter photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'fighter-photos');

CREATE POLICY "Admins can upload fighter photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fighter-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fighter photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fighter-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fighter photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fighter-photos' AND public.has_role(auth.uid(), 'admin'));
