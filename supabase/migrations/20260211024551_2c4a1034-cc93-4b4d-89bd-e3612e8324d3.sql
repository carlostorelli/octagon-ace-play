
-- 1. Role system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add odds to event_fighters
ALTER TABLE public.event_fighters
  ADD COLUMN odds integer DEFAULT 0;

-- 3. Admin write policies for events, fighters, event_fighters
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert fighters"
  ON public.fighters FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fighters"
  ON public.fighters FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fighters"
  ON public.fighters FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert event_fighters"
  ON public.event_fighters FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event_fighters"
  ON public.event_fighters FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event_fighters"
  ON public.event_fighters FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Scoring rules table
CREATE TABLE public.scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name text NOT NULL UNIQUE,
  label text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'fight',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scoring rules are public"
  ON public.scoring_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage scoring rules"
  ON public.scoring_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default scoring rules
INSERT INTO public.scoring_rules (action_name, label, points, description, category) VALUES
  ('victory', 'Vitória', 30, 'Vitória na luta', 'result'),
  ('ko_tko', 'KO/TKO', 50, 'Nocaute ou nocaute técnico', 'result'),
  ('submission', 'Finalização', 50, 'Vitória por finalização', 'result'),
  ('decision', 'Decisão', 20, 'Vitória por decisão', 'result'),
  ('defeat', 'Derrota', -10, 'Derrota na luta', 'result'),
  ('takedown', 'Queda', 5, 'Takedown bem-sucedido', 'fight'),
  ('significant_strike', 'Golpe Significativo', 2, 'Golpe significativo conectado', 'fight'),
  ('knockdown', 'Knockdown', 15, 'Derrubar oponente com golpe', 'fight'),
  ('performance_bonus', 'Performance da Noite', 25, 'Bônus de performance da noite', 'bonus'),
  ('fight_bonus', 'Luta da Noite', 20, 'Bônus de luta da noite', 'bonus'),
  ('captain_multiplier', 'Multiplicador Capitão', 50, 'Porcentagem extra para o capitão (ex: 50 = 1.5x)', 'bonus');

CREATE TRIGGER update_scoring_rules_updated_at
  BEFORE UPDATE ON public.scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
