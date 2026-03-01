import { motion } from "framer-motion";
import { Save, Loader2, Trophy, Swords, Zap, AlertTriangle, Dice1 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const categoryConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  fight_3_rounds: { label: "Luta de 3 Rounds", icon: Swords, description: "Lutas regulares do card" },
  fight_5_rounds: { label: "Luta de 5 Rounds (Sem Cinturão)", icon: Swords, description: "Main events e co-main events" },
  fight_title: { label: "Luta de 5 Rounds (Com Cinturão)", icon: Trophy, description: "Disputas de cinturão" },
  bonus: { label: "Bônus", icon: Zap, description: "Pontos extras por acertos especiais" },
  rules: { label: "Regras Especiais", icon: AlertTriangle, description: "Regras que afetam a pontuação" },
};

const categoryOrder = ["fight_3_rounds", "fight_5_rounds", "fight_title", "bonus", "rules"];

const AdminScoring = () => {
  const queryClient = useQueryClient();
  const [localRules, setLocalRules] = useState<any[]>([]);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["admin-scoring-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scoring_rules").select("*").order("category").order("action_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (rules.length > 0) setLocalRules(rules);
  }, [rules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const rule of localRules) {
        const { error } = await supabase.from("scoring_rules")
          .update({ points: rule.points, label: rule.label, description: rule.description })
          .eq("id", rule.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Regras de pontuação salvas!" });
      queryClient.invalidateQueries({ queryKey: ["admin-scoring-rules"] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateRule = (id: string, field: string, value: any) => {
    setLocalRules((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const sortedCategories = categoryOrder.filter((cat) => localRules.some((r) => r.category === cat));

  const formatPoints = (points: number) => {
    const val = points / 100;
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",");
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Sistema de Pontuação</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pontuação baseada em palpites: Vencedor, Método e Round por luta
            </p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>

        {/* Zebra odds table */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Dice1 className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Pontos de Zebra (Odds)</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Bônus automático baseado nas odds do lutador vencedor. Odds baseadas na média do FightOdds.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { range: "< 2.00", pts: "+1 pt" },
              { range: "2.00–2.29", pts: "+2 pts" },
              { range: "2.30–2.79", pts: "+2,5 pts" },
              { range: "2.80–3.29", pts: "+3 pts" },
              { range: "3.30–3.79", pts: "+3,5 pts" },
              { range: "3.80–4.29", pts: "+4 pts" },
              { range: "4.30–4.79", pts: "+4,5 pts" },
              { range: "4.80+", pts: "+5 pts..." },
            ].map((row) => (
              <div key={row.range} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">{row.range}</span>
                <span className="font-bold text-accent">{row.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          sortedCategories.map((cat) => {
            const config = categoryConfig[cat] || { label: cat, icon: Swords, description: "" };
            const Icon = config.icon;
            const catRules = localRules.filter((r: any) => r.category === cat);

            return (
              <div key={cat} className="glass-card rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                    {config.label}
                  </h2>
                </div>
                {config.description && (
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                )}
                <div className="space-y-2">
                  {catRules.map((rule: any) => (
                    <div key={rule.id} className="rounded-lg bg-muted/30 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                        <OSSInput
                          label="Ação"
                          value={rule.label}
                          onChange={(e) => updateRule(rule.id, "label", e.target.value)}
                        />
                        <div>
                          <OSSInput
                            label="Pontos (x100)"
                            type="number"
                            value={String(rule.points)}
                            onChange={(e) => updateRule(rule.id, "points", parseInt(e.target.value) || 0)}
                            helperText={`= ${formatPoints(rule.points)} pts`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <OSSInput
                            label="Descrição"
                            value={rule.description || ""}
                            onChange={(e) => updateRule(rule.id, "description", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Tiebreaker rules (info only) */}
        <div className="glass-card rounded-xl p-6 space-y-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            Critérios de Desempate
          </h2>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Mais vencedores acertados</li>
            <li>Mais vencedores + métodos acertados</li>
            <li>Mais vencedores + métodos + rounds acertados</li>
            <li>Acertou o vencedor da luta principal</li>
            <li>Acertou o vencedor + método da luta principal</li>
            <li>Acertou o vencedor + método + round da luta principal</li>
            <li>Acertou a Luta da Noite (FOTN)</li>
            <li>Acertou a Performance da Noite (POTN)</li>
            <li>Mais zebras acertadas</li>
          </ol>
          <p className="text-xs text-accent">🤝 Persistindo o empate → empate oficial</p>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminScoring;
