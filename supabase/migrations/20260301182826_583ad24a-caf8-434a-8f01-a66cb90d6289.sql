
-- Add season column to leaderboard
ALTER TABLE public.leaderboard 
ADD COLUMN season text NOT NULL DEFAULT '2026';

-- Create index for efficient season filtering
CREATE INDEX idx_leaderboard_season ON public.leaderboard (season);
