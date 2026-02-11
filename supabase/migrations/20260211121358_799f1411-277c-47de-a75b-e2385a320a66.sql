
-- Add column for PDF URL
ALTER TABLE public.events ADD COLUMN preview_pdf_url text DEFAULT '';

-- Create storage bucket for event PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('event-pdfs', 'event-pdfs', true);

-- Anyone can read event PDFs
CREATE POLICY "Event PDFs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-pdfs');

-- Only admins can upload/update/delete event PDFs
CREATE POLICY "Admins can upload event PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update event PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-pdfs' AND has_role(auth.uid(), 'admin'::app_role));
