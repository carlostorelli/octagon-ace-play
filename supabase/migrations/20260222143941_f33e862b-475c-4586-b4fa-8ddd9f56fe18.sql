
-- Fights table: pairs two fighters in an event
CREATE TABLE public.fights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  fighter_a_id UUID NOT NULL REFERENCES public.fighters(id),
  fighter_b_id UUID NOT NULL REFERENCES public.fighters(id),
  fight_type TEXT NOT NULL DEFAULT '3_rounds', -- '3_rounds', '5_rounds', '5_rounds_title'
  fight_order INTEGER NOT NULL DEFAULT 0,
  card_type TEXT NOT NULL DEFAULT 'main',
  odds_fighter_a NUMERIC(5,2) DEFAULT NULL,
  odds_fighter_b NUMERIC(5,2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fight results
CREATE TABLE public.fight_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  winner_fighter_id UUID REFERENCES public.fighters(id),
  method TEXT, -- 'ko_tko', 'submission', 'decision_unanimous', 'decision_split', 'decision_majority', 'draw', 'no_contest'
  round INTEGER,
  is_fotn BOOLEAN NOT NULL DEFAULT false,
  potn_fighter_ids UUID[] DEFAULT '{}',
  is_fatn BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fight_id)
);

-- User predictions
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  winner_fighter_id UUID NOT NULL REFERENCES public.fighters(id),
  method TEXT, -- 'ko_tko', 'submission', 'decision'
  round INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, fight_id)
);

-- RLS for fights (public read, admin write)
ALTER TABLE public.fights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fights are public" ON public.fights FOR SELECT USING (true);
CREATE POLICY "Admins can insert fights" ON public.fights FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update fights" ON public.fights FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete fights" ON public.fights FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for fight_results (public read, admin write)
ALTER TABLE public.fight_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fight results are public" ON public.fight_results FOR SELECT USING (true);
CREATE POLICY "Admins can insert fight results" ON public.fight_results FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update fight results" ON public.fight_results FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete fight results" ON public.fight_results FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for predictions (user owns their predictions, public read for leaderboard)
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Users can insert own predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own predictions" ON public.predictions FOR DELETE USING (auth.uid() = user_id);

-- Trigger for predictions updated_at
CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_fights_event_id ON public.fights(event_id);
CREATE INDEX idx_fights_order ON public.fights(event_id, fight_order);
CREATE INDEX idx_fight_results_fight_id ON public.fight_results(fight_id);
CREATE INDEX idx_predictions_user_event ON public.predictions(user_id, event_id);
CREATE INDEX idx_predictions_fight ON public.predictions(fight_id);
