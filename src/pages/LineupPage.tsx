import { useState } from "react";
import { motion } from "framer-motion";
import { Swords, DollarSign, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { MOCK_FIGHTERS } from "@/data/mockData";

const SALARY_CAP = 50000;
const MAX_FIGHTERS = 5;

const LineupPage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);

  const totalSalary = selected.reduce((sum, id) => {
    const f = MOCK_FIGHTERS.find((f) => f.id === id);
    return sum + (f?.salary ?? 0);
  }, 0);

  const remaining = SALARY_CAP - totalSalary;

  const toggleFighter = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
      if (captain === id) setCaptain(null);
    } else if (selected.length < MAX_FIGHTERS) {
      const fighter = MOCK_FIGHTERS.find((f) => f.id === id);
      if (fighter && totalSalary + fighter.salary <= SALARY_CAP) {
        setSelected([...selected, id]);
      }
    }
  };

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Escalação</h1>
          <p className="text-muted-foreground">Monte seu time para UFC 313</p>
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
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(totalSalary / SALARY_CAP) * 100}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Swords className="h-3 w-3" />
            {selected.length}/{MAX_FIGHTERS} lutadores · {captain ? "Capitão definido ✓" : "Selecione um capitão"}
          </div>
        </div>

        {/* Fighter List */}
        <div className="space-y-3">
          {MOCK_FIGHTERS.map((fighter, i) => {
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
                    <p className="text-xs text-muted-foreground">
                      {fighter.weightClass} · {fighter.record}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-accent">${fighter.salary.toLocaleString()}</span>
                  {isSelected && !isCaptain && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-accent hover:text-accent hover:bg-accent/10 text-xs"
                      onClick={() => setCaptain(fighter.id)}
                    >
                      <Star className="h-3 w-3 mr-1" /> Cap
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={isSelected
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "border-border text-foreground hover:bg-secondary"
                    }
                    disabled={disabled}
                    onClick={() => toggleFighter(fighter.id)}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : "Escalar"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Confirm */}
        {selected.length === MAX_FIGHTERS && captain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-10 glow shadow-2xl">
              Confirmar Escalação
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default LineupPage;
