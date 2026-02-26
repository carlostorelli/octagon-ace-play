
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _enabled BOOLEAN;
  _title TEXT;
  _message TEXT;
BEGIN
  SELECT enabled INTO _enabled FROM public.notification_settings WHERE key = 'notify_new_user';
  IF _enabled IS TRUE THEN
    SELECT value INTO _title FROM public.site_settings WHERE key = 'welcome_notif_title';
    SELECT value INTO _message FROM public.site_settings WHERE key = 'welcome_notif_message';
    
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      COALESCE(_title, 'Bem-vindo ao OSS Fantasy! 🎉'),
      COALESCE(_message, 'Sua conta foi criada com sucesso. Explore os eventos e faça seus palpites!'),
      'welcome'
    );
  END IF;
  RETURN NEW;
END;
$$;
