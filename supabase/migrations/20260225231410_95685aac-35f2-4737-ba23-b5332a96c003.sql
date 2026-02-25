
-- Single-row table for site regulations content
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Site settings are public" ON public.site_settings
  FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed the regulamento row
INSERT INTO public.site_settings (key, value) VALUES ('regulamento', '# Regulamento

1. Cada usuário pode dar palpites dentro da janela de abertura/fechamento do evento.
2. Pontos são acumulados com base no acerto do vencedor, método e round.
3. Após o fechamento dos palpites, nenhuma alteração é permitida.
4. O ranking geral é a soma de pontos de todos os eventos.
5. Sorteios de brindes serão realizados entre os participantes do ranking.');
