import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const METHODS = [
  { value: "KO/TKO", label: "KO/TKO" },
  { value: "Submission", label: "Finalização" },
  { value: "Decision", label: "Decisão" },
];

interface FightCardProps {
  fight: any;
  prediction: { winner_fighter_id: string; method: string | null; round: number | null } | null;
  onPredict: (pred: { winner_fighter_id: string; method: string | null; round: number | null }) => void;
  index: number;
}

const FightCard = ({ fight, prediction, onPredict, index }: FightCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const fighterA = fight.fighter_a;
  const fighterB = fight.fighter_b;

  const selectedWinner = prediction?.winner_fighter_id;
  const selectedMethod = prediction?.method;
  const selectedRound = prediction?.round;

  const fightTypeLabel = fight.fight_type === "title" ? "Cinturão" : fight.fight_type === "5_rounds" ? "5 Rounds" : "3 Rounds";
  const maxRounds = fight.fight_type === "3_rounds" ? 3 : 5;

  const selectWinner = (fighterId: string) => {
    onPredict({
      winner_fighter_id: fighterId,
      method: prediction?.method ?? null,
      round: prediction?.round ?? null,
    });
    if (!expanded) setExpanded(true);
  };

  const selectMethod = (method: string) => {
    onPredict({
      winner_fighter_id: selectedWinner!,
      method,
      round: method === "Decision" ? null : prediction?.round ?? null,
    });
  };

  const selectRound = (round: number) => {
    onPredict({
      winner_fighter_id: selectedWinner!,
      method: selectedMethod!,
      round,
    });
  };

  const hasPrediction = !!selectedWinner;
  const isComplete = hasPrediction && !!selectedMethod;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card rounded-xl overflow-hidden transition-all ${
        isComplete ? "border-primary/40" : ""
      }`}
    >
      {/* Fight header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{fightTypeLabel}</span>
          {isComplete && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Check className="h-3 w-3" /> Palpite feito
            </span>
          )}
        </div>

        {/* Fighter selection - VS layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          {/* Fighter A */}
          <button
            onClick={() => selectWinner(fighterA.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all border ${
              selectedWinner === fighterA.id
                ? "border-primary bg-primary/10"
                : "border-transparent hover:bg-secondary"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-display text-lg font-bold ${
              selectedWinner === fighterA.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {fighterA.country}
            </div>
            <span className="font-display font-bold uppercase text-sm text-center leading-tight">{fighterA.name}</span>
            <span className="text-xs text-muted-foreground">{fighterA.record}</span>
            {fight.odds_fighter_a != null && (
              <span className="text-xs font-mono text-accent">
                {Number(fight.odds_fighter_a) > 0 ? `+${fight.odds_fighter_a}` : fight.odds_fighter_a}
              </span>
            )}
          </button>

          {/* VS */}
          <div className="flex flex-col items-center">
            <span className="font-display text-lg font-bold text-muted-foreground">VS</span>
          </div>

          {/* Fighter B */}
          <button
            onClick={() => selectWinner(fighterB.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all border ${
              selectedWinner === fighterB.id
                ? "border-primary bg-primary/10"
                : "border-transparent hover:bg-secondary"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-display text-lg font-bold ${
              selectedWinner === fighterB.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {fighterB.country}
            </div>
            <span className="font-display font-bold uppercase text-sm text-center leading-tight">{fighterB.name}</span>
            <span className="text-xs text-muted-foreground">{fighterB.record}</span>
            {fight.odds_fighter_b != null && (
              <span className="text-xs font-mono text-accent">
                {Number(fight.odds_fighter_b) > 0 ? `+${fight.odds_fighter_b}` : fight.odds_fighter_b}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded: method & round selection */}
      {hasPrediction && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-xs text-muted-foreground"
          >
            <span>
              {selectedMethod
                ? `${selectedMethod}${selectedRound ? ` no R${selectedRound}` : ""}`
                : "Escolha o método (+pontos)"}
            </span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
              {/* Method */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Método de vitória</p>
                <div className="flex gap-2">
                  {METHODS.map((m) => (
                    <Button
                      key={m.value}
                      size="sm"
                      variant={selectedMethod === m.value ? "default" : "outline"}
                      className={`text-xs flex-1 ${
                        selectedMethod === m.value
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-secondary"
                      }`}
                      onClick={() => selectMethod(m.value)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Round (only for KO/TKO and Submission) */}
              {selectedMethod && selectedMethod !== "Decision" && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Round</p>
                  <div className="flex gap-2">
                    {Array.from({ length: maxRounds }, (_, i) => i + 1).map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={selectedRound === r ? "default" : "outline"}
                        className={`text-xs w-10 ${
                          selectedRound === r
                            ? "bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:bg-secondary"
                        }`}
                        onClick={() => selectRound(r)}
                      >
                        R{r}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default FightCard;
