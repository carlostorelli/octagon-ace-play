import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Swords, Check, Loader2, FileText, Download, ChevronDown, ChevronUp, Trophy, Lock, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import FightCard from "@/components/predictions/FightCard";

const PredictionsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get next upcoming event
  const { data: nextEvent } = useQuery({
    queryKey: ["next-event"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "upcoming")
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Get fights for the event with fighter details
  const { data: fights = [], isLoading } = useQuery({
    queryKey: ["fights", nextEvent?.id],
    enabled: !!nextEvent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fights")
        .select("*, fighter_a:fighters!fights_fighter_a_id_fkey(*), fighter_b:fighters!fights_fighter_b_id_fkey(*)")
        .eq("event_id", nextEvent!.id)
        .order("fight_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Get existing predictions for this user/event
  const { data: existingPredictions = [] } = useQuery({
    queryKey: ["my-predictions", nextEvent?.id, user?.id],
    enabled: !!nextEvent?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("event_id", nextEvent!.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Local state for predictions keyed by fight_id
  const [predictions, setPredictions] = useState<Record<string, {
    winner_fighter_id: string;
    method: string | null;
    round: number | null;
  }>>({});

  // Initialize from existing predictions
  const initFromExisting = () => {
    if (existingPredictions.length > 0 && Object.keys(predictions).length === 0) {
      const map: typeof predictions = {};
      existingPredictions.forEach((p) => {
        map[p.fight_id] = {
          winner_fighter_id: p.winner_fighter_id,
          method: p.method,
          round: p.round,
        };
      });
      setPredictions(map);
    }
  };
  initFromExisting();

  const setPrediction = (fightId: string, pred: { winner_fighter_id: string; method: string | null; round: number | null }) => {
    setPredictions((prev) => ({ ...prev, [fightId]: pred }));
  };

  const now = new Date();
  const predictionsOpen = nextEvent?.predictions_open_at ? new Date(nextEvent.predictions_open_at) : null;
  const predictionsClose = nextEvent?.predictions_close_at ? new Date(nextEvent.predictions_close_at) : null;

  const isBeforeOpen = predictionsOpen && now < predictionsOpen;
  const isAfterClose = predictionsClose && now > predictionsClose;
  const isLocked = isBeforeOpen || isAfterClose;

  const lockMessage = isBeforeOpen
    ? `Palpites abrem em ${predictionsOpen!.toLocaleString("pt-BR")}`
    : isAfterClose
    ? "Palpites encerrados para este evento"
    : null;

  const totalPredictions = Object.keys(predictions).length;
  const totalFights = fights.length;

  const mainFights = fights.filter((f: any) => f.card_type === "main");
  const prelimFights = fights.filter((f: any) => f.card_type === "prelim");

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !nextEvent) throw new Error("Dados incompletos");

      const entries = Object.entries(predictions);
      if (entries.length === 0) throw new Error("Nenhum palpite selecionado");

      // Upsert predictions (delete existing + insert new)
      const { error: delError } = await supabase
        .from("predictions")
        .delete()
        .eq("event_id", nextEvent.id)
        .eq("user_id", user.id);
      if (delError) throw delError;

      const rows = entries.map(([fight_id, pred]) => ({
        user_id: user.id,
        event_id: nextEvent.id,
        fight_id,
        winner_fighter_id: pred.winner_fighter_id,
        method: pred.method,
        round: pred.round,
      }));

      const { error } = await supabase.from("predictions").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Palpites salvos! 🥊", description: `${totalPredictions} palpites para ${nextEvent?.name}` });
      queryClient.invalidateQueries({ queryKey: ["my-predictions"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Palpites</h1>
            <p className="text-muted-foreground">Faça seus palpites para {nextEvent?.name ?? "o próximo evento"}</p>
          </div>
        </motion.div>

        {/* Lock banner */}
        {isLocked && (
          <div className="glass-card rounded-xl p-5 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-3">
              {isBeforeOpen ? <Clock className="h-5 w-5 text-accent" /> : <Lock className="h-5 w-5 text-destructive" />}
              <div>
                <p className="font-display font-bold text-sm uppercase">{isBeforeOpen ? "Palpites ainda não abertos" : "Palpites encerrados"}</p>
                <p className="text-xs text-muted-foreground">{lockMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="font-medium">Progresso</span>
            </div>
            <div className="text-sm">
              <span className="font-display font-bold text-accent">{totalPredictions}</span>
              <span className="text-muted-foreground"> / {totalFights} lutas</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${totalFights > 0 ? (totalPredictions / totalFights) * 100 : 0}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Escolha o vencedor e o método de vitória para cada luta. Quanto mais detalhes acertar, mais pontos!
          </p>
        </div>

        {/* OSS Preview */}
        {nextEvent && (nextEvent.preview_notes || nextEvent.preview_pdf_url) && (
          <div className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">Previsões do OSS</span>
            </div>
            {nextEvent.preview_notes && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{nextEvent.preview_notes}</p>
            )}
            {nextEvent.preview_pdf_url && (
              <a href={nextEvent.preview_pdf_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Abrir Análise Completa (PDF)
                </Button>
              </a>
            )}
          </div>
        )}

        {!user && (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground">Faça login para salvar seus palpites.</p>
          </div>
        )}

        {/* Fights */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {mainFights.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <Swords className="h-4 w-4 text-primary" />
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">Card Principal</span>
                  <div className="flex-1 h-px bg-primary/20" />
                </div>
                {mainFights.map((fight: any, i: number) => (
                  <FightCard
                    key={fight.id}
                    fight={fight}
                    prediction={predictions[fight.id] ?? null}
                    onPredict={(pred) => setPrediction(fight.id, pred)}
                    index={i}
                    disabled={!!isLocked}
                  />
                ))}
              </>
            )}
            {prelimFights.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-4">
                  <Swords className="h-4 w-4 text-muted-foreground" />
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Card Preliminar</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {prelimFights.map((fight: any, i: number) => (
                  <FightCard
                    key={fight.id}
                    fight={fight}
                    prediction={predictions[fight.id] ?? null}
                    onPredict={(pred) => setPrediction(fight.id, pred)}
                    index={mainFights.length + i}
                    disabled={!!isLocked}
                  />
                ))}
              </>
            )}

            {fights.length === 0 && (
              <div className="glass-card rounded-xl p-10 text-center">
                <Swords className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma luta cadastrada para este evento ainda.</p>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        {totalPredictions > 0 && user && !isLocked && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-10 glow shadow-2xl"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : `Salvar ${totalPredictions} Palpite${totalPredictions > 1 ? "s" : ""}`}
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default PredictionsPage;
