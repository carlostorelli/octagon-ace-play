ALTER TABLE public.leaderboard
ADD CONSTRAINT leaderboard_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);