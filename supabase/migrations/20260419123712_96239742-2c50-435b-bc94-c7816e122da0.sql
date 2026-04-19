-- Remove a policy permissiva atual
DROP POLICY IF EXISTS "Users can view all predictions" ON public.predictions;

-- Nova policy: usuário vê os próprios palpites OU palpites de eventos já fechados OU é admin
CREATE POLICY "Predictions visibility based on event close time"
ON public.predictions
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = predictions.event_id
      AND e.predictions_close_at IS NOT NULL
      AND e.predictions_close_at <= now()
  )
);