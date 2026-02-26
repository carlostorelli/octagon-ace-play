import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  disabled?: boolean;
  lockMessage?: string | null;
}

const FightCard = ({ fight, prediction, onPredict, index, disabled = false, lockMessage }: FightCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempMethod, setTempMethod] = useState<string | null>(null);
  const [tempRound, setTempRound] = useState<number | null>(null);
  const [tempWinner, setTempWinner] = useState<string | null>(null);

  const fighterA = fight.fighter_a;
  const fighterB = fight.fighter_b;

  const selectedWinner = prediction?.winner_fighter_id;
  const selectedMethod = prediction?.method;
  const selectedRound = prediction?.round;

  const fightTypeLabel = fight.fight_type === "title" ? "Cinturão" : fight.fight_type === "5_rounds" ? "5 Rounds" : "3 Rounds";
  const maxRounds = fight.fight_type === "3_rounds" ? 3 : 5;

  const selectWinner = (fighterId: string) => {
    if (disabled) {
      if (lockMessage) {
        toast({ title: "🔒 Palpites bloqueados", description: lockMessage, variant: "destructive" });
      }
      return;
    }
    setTempWinner(fighterId);
    setTempMethod(prediction?.method ?? null);
    setTempRound(prediction?.round ?? null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!tempWinner || !tempMethod) return;
    onPredict({
      winner_fighter_id: tempWinner,
      method: tempMethod,
      round: tempMethod === "Decision" ? null : tempRound,
    });
    setDialogOpen(false);
  };

  const isComplete = !!selectedWinner && !!selectedMethod;
  const winnerName = selectedWinner === fighterA.id ? fighterA.name : selectedWinner === fighterB.id ? fighterB.name : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`glass-card rounded-xl overflow-hidden transition-all ${isComplete ? "border-primary/40" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{fightTypeLabel}</span>
            {isComplete && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> {selectedMethod}{selectedRound ? ` R${selectedRound}` : ""}
              </span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            {/* Fighter A */}
            <button
              onClick={() => selectWinner(fighterA.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border cursor-pointer ${
                selectedWinner === fighterA.id
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-secondary"
              } ${disabled ? "opacity-50" : ""}`}
            >
              <span className="font-display font-bold uppercase text-sm text-center leading-tight">{fighterA.name}</span>
              <span className="text-xs text-muted-foreground">{fighterA.record}</span>
              {fight.odds_fighter_a != null && (
                <span className="text-xs font-mono text-accent">
                  {Number(fight.odds_fighter_a) > 0 ? `+${fight.odds_fighter_a}` : fight.odds_fighter_a}
                </span>
              )}
            </button>

            <span className="font-display text-lg font-bold text-muted-foreground">VS</span>

            {/* Fighter B */}
            <button
              onClick={() => selectWinner(fighterB.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border cursor-pointer ${
                selectedWinner === fighterB.id
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-secondary"
              } ${disabled ? "opacity-50" : ""}`}
            >
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
      </motion.div>

      {/* Method/Round Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase text-center">
              {tempWinner === fighterA.id ? fighterA.name : fighterB.name} vence
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Method */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Método de vitória</p>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <Button
                    key={m.value}
                    size="sm"
                    variant={tempMethod === m.value ? "default" : "outline"}
                    onClick={() => {
                      setTempMethod(m.value);
                      if (m.value === "Decision") setTempRound(null);
                    }}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Round */}
            {tempMethod && tempMethod !== "Decision" && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Round</p>
                <div className="flex gap-2">
                  {Array.from({ length: maxRounds }, (_, i) => i + 1).map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={tempRound === r ? "default" : "outline"}
                      className="w-12"
                      onClick={() => setTempRound(r)}
                    >
                      R{r}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <Button
              className="w-full font-display uppercase tracking-wider"
              disabled={!tempMethod}
              onClick={handleSave}
            >
              Confirmar Palpite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FightCard;
