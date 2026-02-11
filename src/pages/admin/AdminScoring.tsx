import { motion } from "framer-motion";
import { Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const categoryLabels: Record<string, string> = {
  result: "Resultado da Luta",
  fight: "Ações na Luta",
  bonus: "Bônus",
};

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

  const categories = [...new Set(localRules.map((r: any) => r.category))];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Regras de Pontuação</h1>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="space-y-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                {categoryLabels[cat] || cat}
              </h2>
              <div className="space-y-2">
                {localRules.filter((r: any) => r.category === cat).map((rule: any) => (
                  <div key={rule.id} className="glass-card rounded-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      <OSSInput
                        label="Ação"
                        value={rule.label}
                        onChange={(e) => updateRule(rule.id, "label", e.target.value)}
                      />
                      <OSSInput
                        label={rule.action_name === "captain_multiplier" ? "% Extra" : "Pontos"}
                        type="number"
                        value={String(rule.points)}
                        onChange={(e) => updateRule(rule.id, "points", parseInt(e.target.value) || 0)}
                      />
                      <div className="sm:col-span-2">
                        <OSSInput
                          label="Descrição"
                          value={rule.description}
                          onChange={(e) => updateRule(rule.id, "description", e.target.value)}
                        />
                      </div>
                    </div>
                    {rule.action_name === "captain_multiplier" && (
                      <p className="text-xs text-accent mt-2">
                        Multiplicador atual: {1 + rule.points / 100}x (ex: 50 = 1.5x, 100 = 2x)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminScoring;
