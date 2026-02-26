
-- Create table for multiple welcome messages
CREATE TABLE public.welcome_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Welcome messages are public readable" ON public.welcome_messages FOR SELECT USING (true);
CREATE POLICY "Admins can manage welcome messages" ON public.welcome_messages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with default message
INSERT INTO public.welcome_messages (title, message) VALUES
  ('Bem-vindo ao OSS Fantasy! 🎉', 'Sua conta foi criada com sucesso. Explore os eventos e faça seus palpites!');

-- Update trigger to pick a random welcome message from the table
CREATE OR REPLACE FUNCTION public.notify_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _enabled BOOLEAN;
  _title TEXT;
  _message TEXT;
BEGIN
  SELECT enabled INTO _enabled FROM public.notification_settings WHERE key = 'notify_new_user';
  IF _enabled IS TRUE THEN
    SELECT wm.title, wm.message INTO _title, _message
    FROM public.welcome_messages wm
    ORDER BY random()
    LIMIT 1;

    IF _title IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.user_id, _title, _message, 'welcome');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_welcome_messages_updated_at
BEFORE UPDATE ON public.welcome_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
