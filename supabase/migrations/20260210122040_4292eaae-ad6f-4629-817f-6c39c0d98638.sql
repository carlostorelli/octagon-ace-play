
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'live')),
  fights_count INT NOT NULL DEFAULT 0,
  main_event TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public" ON public.events FOR SELECT USING (true);

-- Fighters table
CREATE TABLE public.fighters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  weight_class TEXT NOT NULL DEFAULT '',
  salary INT NOT NULL DEFAULT 0,
  record TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fighters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fighters are public" ON public.fighters FOR SELECT USING (true);

-- Lineups table
CREATE TABLE public.lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  captain_fighter_id UUID REFERENCES public.fighters(id),
  total_salary INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own lineups" ON public.lineups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lineups" ON public.lineups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lineups" ON public.lineups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lineups" ON public.lineups FOR DELETE USING (auth.uid() = user_id);

-- Lineup fighters (many-to-many)
CREATE TABLE public.lineup_fighters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES public.fighters(id) ON DELETE CASCADE,
  UNIQUE (lineup_id, fighter_id)
);
ALTER TABLE public.lineup_fighters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own lineup fighters" ON public.lineup_fighters FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.lineups WHERE lineups.id = lineup_id AND lineups.user_id = auth.uid()));
CREATE POLICY "Users can insert own lineup fighters" ON public.lineup_fighters FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.lineups WHERE lineups.id = lineup_id AND lineups.user_id = auth.uid()));
CREATE POLICY "Users can delete own lineup fighters" ON public.lineup_fighters FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.lineups WHERE lineups.id = lineup_id AND lineups.user_id = auth.uid()));

-- Leaderboard (materialized from lineups/scores, but for now a simple table)
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id),
  points INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard is public" ON public.leaderboard FOR SELECT USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON public.leaderboard FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
