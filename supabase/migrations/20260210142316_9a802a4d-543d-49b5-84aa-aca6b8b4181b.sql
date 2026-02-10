
-- Add card_type and fight_order to event_fighters for proper ordering
ALTER TABLE public.event_fighters 
ADD COLUMN card_type text NOT NULL DEFAULT 'main',
ADD COLUMN fight_order integer NOT NULL DEFAULT 0;

-- card_type: 'main' or 'prelim'
-- fight_order: lower = more important (1 = main event)
