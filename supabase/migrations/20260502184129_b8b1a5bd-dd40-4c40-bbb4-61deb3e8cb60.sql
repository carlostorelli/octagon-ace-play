INSERT INTO public.site_settings (key, value) VALUES
  ('pwa_name', 'OSS Fantasy - Palpites de MMA'),
  ('pwa_short_name', 'OSS Fantasy'),
  ('pwa_description', 'Faça seus palpites de MMA e domine o octógono!'),
  ('pwa_theme_color', '#000000'),
  ('pwa_background_color', '#0a0a0a'),
  ('pwa_icon_url', ''),
  ('pwa_apple_touch_icon_url', ''),
  ('pwa_splash_image_url', ''),
  ('pwa_install_banner_title', 'Instale o OSS Fantasy'),
  ('pwa_install_banner_subtitle', 'Acesso rápido, notificações e experiência completa direto da sua tela inicial.'),
  ('pwa_install_modal_title', 'Instalar no iPhone'),
  ('pwa_install_modal_description', 'Toque no botão Compartilhar e depois em "Adicionar à Tela de Início".')
ON CONFLICT (key) DO NOTHING;