import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Check, Award, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const METHODS = [
  { value: "ko_tko", label: "KO/TKO" },
  { value: "submission", label: "Finalização" },
  { value: "decision_unanimous", label: "Decisão Unânime" },
  { value: "decision_split", label: "Decisão Dividida" },
  { value: "decision_majority", label: "Decisão Majoritária" },
  { value: "draw", label: "Empate" },
  { value: "no_contest", label: "No Contest" },
  { value: "cancelled", label: "Cancelada" },
];

const AdminResults = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["admin-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: fights = [], isLoading } = useQuery({
    queryKey: ["admin-fights-results", eventId],
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

  const { data: existingResults = [] } = useQuery({
    queryKey: ["admin-fight-results", eventId],
    enabled: fights.length > 0,
    queryFn: async () => {
      const fightIds = fights.map((f: any) => f.id);
      const { data, error } = await supabase
        .from("fight_results")
        .select("*")
        .in("fight_id", fightIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Local state per fight
  const [results, setResults] = useState<Record<string, {
    winner_fighter_id: string | null;
    method: string;
    round: number | null;
    is_fotn: boolean;
    is_fatn: boolean;
  }>>({});

  // Initialize from existing
  const initDone = useState(false);
  if (!initDone[0] && existingResults.length > 0) {
    const map: typeof results = {};
    existingResults.forEach((r: any) => {
      map[r.fight_id] = {
        winner_fighter_id: r.winner_fighter_id,
        method: r.method || "",
        round: r.round,
        is_fotn: r.is_fotn,
        is_fatn: r.is_fatn,
      };
    });
    setResults(map);
    initDone[1](true);
  }

  const getResult = (fightId: string) =>
    results[fightId] ?? { winner_fighter_id: null, method: "", round: null, is_fotn: false, is_fatn: false };

  const updateResult = (fightId: string, partial: Partial<typeof results[string]>) => {
    setResults((prev) => ({
      ...prev,
      [fightId]: { ...getResult(fightId), ...partial },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const noWinnerMethods = ["draw", "no_contest", "cancelled"];
      const entries = Object.entries(results).filter(([_, r]) => r.winner_fighter_id || noWinnerMethods.includes(r.method));
      if (entries.length === 0) throw new Error("Nenhum resultado preenchido");

      for (const [fight_id, r] of entries) {
        const existing = existingResults.find((er: any) => er.fight_id === fight_id);
        const payload = {
          fight_id,
          winner_fighter_id: r.winner_fighter_id,
          method: r.method || null,
          round: r.round,
          is_fotn: r.is_fotn,
          is_fatn: r.is_fatn,
        };
        if (existing) {
          const { error } = await supabase.from("fight_results").update(payload).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("fight_results").insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Resultados salvos! ✅" });
      queryClient.invalidateQueries({ queryKey: ["admin-fight-results", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const mainFights = fights.filter((f: any) => f.card_type === "main");
  const prelimFights = fights.filter((f: any) => f.card_type === "prelim");
  const noWinnerMethods = ["draw", "no_contest", "cancelled"];
  const filledCount = Object.values(results).filter((r) => r.winner_fighter_id || noWinnerMethods.includes(r.method)).length;

  const isDecision = (method: string) => method.startsWith("decision");
  const isNoWinner = (method: string) => noWinnerMethods.includes(method);

  const renderFight = (fight: any) => {
    const r = getResult(fight.id);
    const hasExisting = existingResults.some((er: any) => er.fight_id === fight.id);
    const maxRounds = fight.fight_type === "3_rounds" ? 3 : 5;

    return (
      <div key={fight.id} className={`glass-card rounded-xl p-5 space-y-4 transition-colors ${hasExisting ? "border-accent/30" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{fight.fight_order}</span>
            <span className="font-display font-bold uppercase text-sm">{fight.fighter_a?.name}</span>
            <span className="text-xs font-bold text-primary">VS</span>
            <span className="font-display font-bold uppercase text-sm">{fight.fighter_b?.name}</span>
          </div>
          {hasExisting && <Check className="h-4 w-4 text-accent" />}
        </div>

        {/* Winner selection */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display mb-2 block">Vencedor</label>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={r.winner_fighter_id === fight.fighter_a_id ? "default" : "outline"}
              onClick={() => updateResult(fight.id, { winner_fighter_id: fight.fighter_a_id })}
              className="flex-1"
            >
              {fight.fighter_a?.name}
            </Button>
            <Button
              size="sm"
              variant={r.winner_fighter_id === fight.fighter_b_id ? "default" : "outline"}
              onClick={() => updateResult(fight.id, { winner_fighter_id: fight.fighter_b_id })}
              className="flex-1"
            >
              {fight.fighter_b?.name}
            </Button>
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display mb-2 block">Método</label>
          <div className="flex gap-2 flex-wrap">
            {METHODS.map((m) => (
              <Button
                key={m.value}
                size="sm"
                variant={r.method === m.value ? "default" : "outline"}
                onClick={() => updateResult(fight.id, {
                  method: m.value,
                  round: isDecision(m.value) ? maxRounds : r.round,
                })}
                className="text-xs"
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Round */}
        {r.method && !isDecision(r.method) && !isNoWinner(r.method) && (
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display mb-2 block">Round</label>
            <div className="flex gap-2">
              {Array.from({ length: maxRounds }, (_, i) => i + 1).map((rd) => (
                <Button
                  key={rd}
                  size="sm"
                  variant={r.round === rd ? "default" : "outline"}
                  onClick={() => updateResult(fight.id, { round: rd })}
                  className="w-10"
                >
                  R{rd}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Bonuses */}
        <div className="flex gap-3 pt-1">
          <Button
            size="sm"
            variant={r.is_fotn ? "default" : "outline"}
            onClick={() => updateResult(fight.id, { is_fotn: !r.is_fotn })}
            className={`gap-1.5 text-xs ${r.is_fotn ? "bg-accent hover:bg-accent/90" : ""}`}
          >
            <Award className="h-3.5 w-3.5" />
            Luta da Noite
          </Button>
          <Button
            size="sm"
            variant={r.is_fatn ? "default" : "outline"}
            onClick={() => updateResult(fight.id, { is_fatn: !r.is_fatn })}
            className={`gap-1.5 text-xs ${r.is_fatn ? "bg-accent hover:bg-accent/90" : ""}`}
          >
            <Star className="h-3.5 w-3.5" />
            Performance da Noite
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
              Resultados — {event?.name ?? "..."}
            </h1>
            <p className="text-sm text-muted-foreground">{event?.date} · {event?.location}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-display font-bold text-accent">{filledCount}</span> / {fights.length} preenchidos
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {mainFights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">Card Principal</span>
                  <div className="flex-1 h-px bg-primary/20" />
                </div>
                {mainFights.map(renderFight)}
              </div>
            )}
            {prelimFights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Card Preliminar</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {prelimFights.map(renderFight)}
              </div>
            )}
            {fights.length === 0 && (
              <div className="glass-card rounded-xl p-10 text-center">
                <p className="text-muted-foreground">Nenhuma luta cadastrada para este evento.</p>
              </div>
            )}
          </>
        )}

        {filledCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-6 flex justify-center z-50">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-10 glow shadow-2xl"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
              Salvar {filledCount} Resultado{filledCount > 1 ? "s" : ""}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminResults;
