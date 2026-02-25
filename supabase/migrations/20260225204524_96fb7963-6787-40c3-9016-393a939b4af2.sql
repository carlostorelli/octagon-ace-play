
ALTER TABLE public.events
ADD COLUMN predictions_open_at timestamp with time zone,
ADD COLUMN predictions_close_at timestamp with time zone;
