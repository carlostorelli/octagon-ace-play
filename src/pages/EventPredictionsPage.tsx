import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Swords, Check, Loader2, FileText, Download, Trophy, Lock, Clock, Pencil, ArrowLeft, Play } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import FightCard from "@/components/predictions/FightCard";

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const EventPredictionsPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: fights = [], isLoading } = useQuery({
    queryKey: ["fights", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fights")
        .select("*, fighter_a:fighters!fights_fighter_a_id_fkey(*), fighter_b:fighters!fights_fighter_b_id_fkey(*)")
        .eq("event_id", eventId!)
        .order("fight_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: existingPredictions = [] } = useQuery({
    queryKey: ["my-predictions", eventId, user?.id],
    enabled: !!eventId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [predictions, setPredictions] = useState<Record<string, {
    winner_fighter_id: string;
    method: string | null;
    round: number | null;
  }>>({});

  // Initialize from existing
  useEffect(() => {
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
  }, [existingPredictions]);

  const setPrediction = (fightId: string, pred: { winner_fighter_id: string; method: string | null; round: number | null }) => {
    setPredictions((prev) => ({ ...prev, [fightId]: pred }));
  };

  // Lock logic
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const predictionsOpen = event?.predictions_open_at ? new Date(event.predictions_open_at) : null;
  const predictionsClose = event?.predictions_close_at ? new Date(event.predictions_close_at) : null;

  const isBeforeOpen = predictionsOpen && now < predictionsOpen;
  const isAfterClose = predictionsClose && now > predictionsClose;
  const isEventCompleted = event?.status === "completed";
  const isLocked = isBeforeOpen || isAfterClose || isEventCompleted;

  const lockMessage = isBeforeOpen
    ? `Palpites abrem em ${predictionsOpen!.toLocaleString("pt-BR")}`
    : isAfterClose || isEventCompleted
    ? "Palpites encerrados para este evento"
    : null;

  const totalPredictions = Object.keys(predictions).length;
  const totalFights = fights.length;
  const hasSavedPredictions = existingPredictions.length > 0;

  const mainFights = fights.filter((f: any) => f.card_type === "main");
  const prelimFights = fights.filter((f: any) => f.card_type === "prelim");

  // When locked: only show summary (read-only). Never allow editing.
  const showFightCards = isLocked
    ? (!hasSavedPredictions) // show cards read-only only if no predictions saved
    : (!hasSavedPredictions || isEditing);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !eventId) throw new Error("Dados incompletos");
      if (isLocked) throw new Error("Palpites estão encerrados");

      const entries = Object.entries(predictions);
      if (entries.length === 0) throw new Error("Nenhum palpite selecionado");

      const { error: delError } = await supabase
        .from("predictions")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
      if (delError) throw delError;

      const rows = entries.map(([fight_id, pred]) => ({
        user_id: user.id,
        event_id: eventId,
        fight_id,
        winner_fighter_id: pred.winner_fighter_id,
        method: pred.method,
        round: pred.round,
      }));

      const { error } = await supabase.from("predictions").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Palpites salvos! 🥊", description: `${totalPredictions} palpites para ${event?.name}` });
      queryClient.invalidateQueries({ queryKey: ["my-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["my-prediction-counts"] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const getMethodLabel = (method: string | null) => {
    if (method === "Submission") return "Finalização";
    if (method === "Decision") return "Decisão";
    return method;
  };

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" className="gap-2 mb-4" onClick={() => navigate("/predictions")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">
            {event?.name ?? "Carregando..."}
          </h1>
          <p className="text-muted-foreground">{event?.main_event}</p>
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

        {/* OSS Preview */}
        {event && (event.preview_notes || event.preview_pdf_url || (event as any).preview_video_url) && (
          <div className="glass-card rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">Previsões do OSS</span>
            </div>
            {event.preview_notes && (
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{event.preview_notes}</p>
            )}
            {event.preview_notes && (event as any).preview_video_url && (
              <div className="h-px bg-border" />
            )}
            {(() => {
              const videoId = getYouTubeId((event as any).preview_video_url || "");
              if (!videoId) return null;
              return (
                <div className="rounded-lg overflow-hidden border border-border">
                  <AspectRatio ratio={16 / 9}>
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={`Análise ${event.name}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </AspectRatio>
                </div>
              );
            })()}
            {event.preview_pdf_url && (
              <>
                {((event as any).preview_video_url || event.preview_notes) && <div className="h-px bg-border" />}
                <a href={event.preview_pdf_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" /> Abrir Análise Completa (PDF)
                  </Button>
                </a>
              </>
            )}
          </div>
        )}

        {!user && (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground">Faça login para salvar seus palpites.</p>
          </div>
        )}

        {/* Meus Palpites - resumo */}
        {user && hasSavedPredictions && !isEditing && fights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                <span className="font-display text-sm font-bold uppercase tracking-wider text-accent">Meus Palpites</span>
              </div>
              {!isLocked && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              )}
            </div>
            <div className="glass-card rounded-xl divide-y divide-border overflow-hidden">
              {fights.map((fight: any) => {
                const pred = predictions[fight.id];
                if (!pred) return null;
                const winnerName = pred.winner_fighter_id === fight.fighter_a?.id
                  ? fight.fighter_a?.name : fight.fighter_b?.name;
                const loserName = pred.winner_fighter_id === fight.fighter_a?.id
                  ? fight.fighter_b?.name : fight.fighter_a?.name;
                return (
                  <div key={fight.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-display font-bold uppercase text-foreground">{winnerName}</span>
                      <span className="text-xs text-muted-foreground">vs {loserName}</span>
                    </div>
                    <span className="text-muted-foreground text-right">
                      {getMethodLabel(pred.method)}{pred.round ? ` — R${pred.round}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            {isLocked && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Seus palpites estão trancados e não podem mais ser alterados.
              </p>
            )}
          </div>
        )}

        {/* Fight cards */}
        {showFightCards && (
          <>
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
                Escolha o vencedor e o método de vitória para cada luta.
              </p>
            </div>

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
                      <FightCard key={fight.id} fight={fight} prediction={predictions[fight.id] ?? null}
                        onPredict={(pred) => setPrediction(fight.id, pred)} index={i} disabled={!!isLocked} />
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
                      <FightCard key={fight.id} fight={fight} prediction={predictions[fight.id] ?? null}
                        onPredict={(pred) => setPrediction(fight.id, pred)} index={mainFights.length + i} disabled={!!isLocked} />
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

            {totalPredictions > 0 && user && !isLocked && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3">
                {isEditing && (
                  <Button size="lg" variant="outline" className="font-display uppercase tracking-wider" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                )}
                <Button size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-10 glow shadow-2xl"
                  onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : `Salvar ${totalPredictions} Palpite${totalPredictions > 1 ? "s" : ""}`}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default EventPredictionsPage;
