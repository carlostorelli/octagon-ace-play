-- Fix numeric overflow on fight odds (was NUMERIC(5,2), max 999.99 — overflowed on -1100)
ALTER TABLE public.fights
  ALTER COLUMN odds_fighter_a TYPE NUMERIC(7,2),
  ALTER COLUMN odds_fighter_b TYPE NUMERIC(7,2);