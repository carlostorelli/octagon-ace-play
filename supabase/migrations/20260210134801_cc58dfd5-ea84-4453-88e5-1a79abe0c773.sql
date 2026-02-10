
-- Table linking fighters to specific events (cards)
CREATE TABLE public.event_fighters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES public.fighters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, fighter_id)
);

-- Enable RLS
ALTER TABLE public.event_fighters ENABLE ROW LEVEL SECURITY;

-- Public read access (same as events/fighters)
CREATE POLICY "Event fighters are public"
  ON public.event_fighters
  FOR SELECT
  USING (true);
