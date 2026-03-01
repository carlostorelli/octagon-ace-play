
-- Add tiebreaker columns to leaderboard
ALTER TABLE public.leaderboard
  ADD COLUMN IF NOT EXISTS correct_methods integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_rounds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS main_event_winner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS main_event_method boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS main_event_round boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fotn_correct boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS potn_correct boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS zebra_count integer NOT NULL DEFAULT 0;
