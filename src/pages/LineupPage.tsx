import { useState } from "react";
import { motion } from "framer-motion";
import { Swords, DollarSign, Star, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

const SALARY_CAP = 50000;
const MAX_FIGHTERS = 5;

const LineupPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const { data: fighterEntries = [], isLoading } = useQuery({
    queryKey: ["fighters", nextEvent?.id],
    enabled: !!nextEvent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_fighters")
        .select("fighter_id, card_type, fight_order, fighters(*)")
        .eq("event_id", nextEvent!.id);
      if (error) throw error;
      return (data ?? [])
        .filter((ef: any) => ef.fighters)
        .sort((a: any, b: any) => {
          // main before prelim
          if (a.card_type !== b.card_type) return a.card_type === 'main' ? -1 : 1;
          // then by fight_order
          return a.fight_order - b.fight_order;
        })
        .map((ef: any) => ({ ...ef.fighters, card_type: ef.card_type, fight_order: ef.fight_order }));
    },
  });

  const fighters = fighterEntries;

  const totalSalary = selected.reduce((sum, id) => {
    const f = fighters.find((f) => f.id === id);
    return sum + (f?.salary ?? 0);
  }, 0);
  const remaining = SALARY_CAP - totalSalary;

  const toggleFighter = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
      if (captain === id) setCaptain(null);
    } else if (selected.length < MAX_FIGHTERS) {
      const fighter = fighters.find((f) => f.id === id);
      if (fighter && totalSalary + fighter.salary <= SALARY_CAP) {
        setSelected([...selected, id]);
      }
    }
  };

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!user || !nextEvent || !captain) throw new Error("Dados incompletos");

      // Create lineup
      const { data: lineup, error: lineupError } = await supabase
        .from("lineups")
        .insert({
          user_id: user.id,
          event_id: nextEvent.id,
          captain_fighter_id: captain,
          total_salary: totalSalary,
        })
        .select()
        .single();
      if (lineupError) throw lineupError;

      // Insert fighters
      const { error: fightersError } = await supabase
        .from("lineup_fighters")
        .insert(selected.map((fid) => ({ lineup_id: lineup.id, fighter_id: fid })));
      if (fightersError) throw fightersError;

      return lineup;
    },
    onSuccess: () => {
      toast({ title: "Escalação confirmada! 🥊", description: `Time salvo para ${nextEvent?.name}` });
      setSelected([]);
      setCaptain(null);
      queryClient.invalidateQueries({ queryKey: ["lineups"] });
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
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Escalação</h1>
            <p className="text-muted-foreground">Monte seu time para {nextEvent?.name ?? "o próximo evento"}</p>
          </div>
          <div className="w-full sm:w-72">
            <OSSInput variant="search" inputSize="sm" placeholder="Buscar lutador..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </motion.div>

        {/* Salary Bar */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-accent" />
              <span className="font-medium">Salary Cap</span>
            </div>
            <div className="text-sm">
              <span className="font-display font-bold text-accent">${remaining.toLocaleString()}</span>
              <span className="text-muted-foreground"> / ${SALARY_CAP.toLocaleString()}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${(totalSalary / SALARY_CAP) * 100}%` }} transition={{ type: "spring", stiffness: 100 }} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Swords className="h-3 w-3" />
            {selected.length}/{MAX_FIGHTERS} lutadores · {captain ? "Capitão definido ✓" : "Selecione um capitão"}
          </div>
        </div>

        {!user && (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground">Faça login para salvar sua escalação.</p>
          </div>
        )}

        {/* Fighter List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const filtered = fighters.filter((f: any) =>
                f.name.toLowerCase().includes(search.toLowerCase()) ||
                f.weight_class.toLowerCase().includes(search.toLowerCase()) ||
                f.nickname.toLowerCase().includes(search.toLowerCase())
              );
              const mainFighters = filtered.filter((f: any) => f.card_type === 'main');
              const prelimFighters = filtered.filter((f: any) => f.card_type === 'prelim');
              let idx = 0;

              return (
                <>
                  {mainFighters.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pt-2">
                        <Swords className="h-4 w-4 text-primary" />
                        <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">Card Principal</span>
                        <div className="flex-1 h-px bg-primary/20" />
                      </div>
                      {mainFighters.map((fighter: any) => {
                        const i = idx++;
                        const isSelected = selected.includes(fighter.id);
                        const isCaptain = captain === fighter.id;
                        const canAfford = totalSalary + fighter.salary <= SALARY_CAP;
                        const disabled = !isSelected && (selected.length >= MAX_FIGHTERS || !canAfford);

                        return (
                          <motion.div
                            key={fighter.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`glass-card rounded-xl p-4 flex items-center justify-between transition-all ${
                              isSelected ? "border-primary/40 bg-primary/5" : disabled ? "opacity-50" : "hover:border-border"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-display text-lg font-bold ${
                                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              }`}>
                                {fighter.country}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-bold uppercase">{fighter.name}</span>
                                  {isCaptain && (
                                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                      <Star className="h-3 w-3" /> Capitão
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{fighter.weight_class} · {fighter.record}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-display font-bold text-accent">${fighter.salary.toLocaleString()}</span>
                              {isSelected && !isCaptain && (
                                <Button size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10 text-xs" onClick={() => setCaptain(fighter.id)}>
                                  <Star className="h-3 w-3 mr-1" /> Cap
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className={isSelected ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}
                                disabled={disabled}
                                onClick={() => toggleFighter(fighter.id)}
                              >
                                {isSelected ? <Check className="h-4 w-4" /> : "Escalar"}
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                  {prelimFighters.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pt-4">
                        <Swords className="h-4 w-4 text-muted-foreground" />
                        <span className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Card Preliminar</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      {prelimFighters.map((fighter: any) => {
                        const i = idx++;
                        const isSelected = selected.includes(fighter.id);
                        const isCaptain = captain === fighter.id;
                        const canAfford = totalSalary + fighter.salary <= SALARY_CAP;
                        const disabled = !isSelected && (selected.length >= MAX_FIGHTERS || !canAfford);

                        return (
                          <motion.div
                            key={fighter.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`glass-card rounded-xl p-4 flex items-center justify-between transition-all ${
                              isSelected ? "border-primary/40 bg-primary/5" : disabled ? "opacity-50" : "hover:border-border"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-display text-lg font-bold ${
                                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              }`}>
                                {fighter.country}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-bold uppercase">{fighter.name}</span>
                                  {isCaptain && (
                                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                      <Star className="h-3 w-3" /> Capitão
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{fighter.weight_class} · {fighter.record}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-display font-bold text-accent">${fighter.salary.toLocaleString()}</span>
                              {isSelected && !isCaptain && (
                                <Button size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10 text-xs" onClick={() => setCaptain(fighter.id)}>
                                  <Star className="h-3 w-3 mr-1" /> Cap
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className={isSelected ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}
                                disabled={disabled}
                                onClick={() => toggleFighter(fighter.id)}
                              >
                                {isSelected ? <Check className="h-4 w-4" /> : "Escalar"}
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Confirm */}
        {selected.length === MAX_FIGHTERS && captain && user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-10 glow shadow-2xl"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? "Salvando..." : "Confirmar Escalação"}
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default LineupPage;
