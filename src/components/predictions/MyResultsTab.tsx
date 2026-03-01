import { Swords, Trophy, Target, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getMethodLabel = (method: string | null) => {
  if (method === "Submission") return "Finalização";
  if (method === "Decision") return "Decisão";
  if (method === "Cancelled") return "Cancelada";
  return method ?? "—";
};

const normalizePredMethod = (m: string) => {
  const lower = m.toLowerCase();
  if (lower === "decision") return "decision";
  if (lower === "ko/tko") return "ko_tko";
  if (lower === "submission") return "submission";
  return lower;
};

const normalizeResultMethod = (m: string) => {
  if (m.startsWith("decision")) return "decision";
  return m;
};

// Full match: for Decision, just method. For KO/TKO and Submission, method + round.
const isFullMethodMatch = (pred: { method: string | null; round: number | null }, result: { method: string | null; round: number | null }) => {
  if (!pred.method || !result.method) return false;
  const pm = normalizePredMethod(pred.method);
  const rm = normalizeResultMethod(result.method);
  if (pm !== rm) return false;
  if (pm === "decision") return true;
  return pred.round != null && result.round != null && pred.round === result.round;
};

interface MyResultsTabProps {
  fights: any[];
  predictions: Record<string, { winner_fighter_id: string; method: string | null; round: number | null }>;
  results: any[];
}

export default function MyResultsTab({ fights, predictions, results }: MyResultsTabProps) {
  const resultMap = Object.fromEntries(results.map((r) => [r.fight_id, r]));

  let correctWinners = 0;
  let correctMethods = 0;
  let totalWithResult = 0;

  fights.forEach((fight) => {
    const pred = predictions[fight.id];
    const result = resultMap[fight.id];
    if (!result || !result.winner_fighter_id) return; // skip cancelled/no result
    totalWithResult++;
    if (pred && result.winner_fighter_id === pred.winner_fighter_id) {
      correctWinners++;
      if (isFullMethodMatch(pred, result)) {
        correctMethods++;
      }
    }
  });

  const totalPredictions = Object.keys(predictions).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{totalPredictions}/{fights.length}</p>
          <p className="text-xs text-muted-foreground">Palpites</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-accent">{correctWinners}</p>
          <p className="text-xs text-muted-foreground">Acertos</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-green-400">{correctMethods}</p>
          <p className="text-xs text-muted-foreground">Método exato</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50" /> Vencedor + Método</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-accent/20 border border-accent/40" /> Só vencedor</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/40" /> Errou</span>
      </div>

      {/* Fight list */}
      <div className="glass-card rounded-xl overflow-hidden divide-y divide-border">
        {fights.map((fight: any) => {
          const pred = predictions[fight.id];
          const result = resultMap[fight.id];
          const fighterA = fight.fighter_a;
          const fighterB = fight.fighter_b;

          const isCancelled = result && !result.winner_fighter_id;
          const isWinnerCorrect = result && result.winner_fighter_id && pred && result.winner_fighter_id === pred.winner_fighter_id;
          const isMethodCorrect = isWinnerCorrect && pred ? isFullMethodMatch(pred, result) : false;

          const bgClass = !pred
            ? "bg-background/50"
            : !result || isCancelled
            ? "bg-background/50"
            : isMethodCorrect
            ? "bg-green-500/10 border-l-4 border-l-green-500"
            : isWinnerCorrect
            ? "bg-accent/5 border-l-4 border-l-accent"
            : "bg-destructive/5 border-l-4 border-l-destructive";

          const pickedName = pred
            ? (pred.winner_fighter_id === fighterA?.id ? fighterA?.name : fighterB?.name)
            : null;

          return (
            <div key={fight.id} className={`flex items-center justify-between px-4 py-3 text-sm ${bgClass}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Swords className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">
                  {fighterA?.name} vs {fighterB?.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {pred ? (
                  <>
                    <span className={`font-display font-bold uppercase text-xs ${
                      isCancelled ? "text-muted-foreground" : isMethodCorrect ? "text-green-400" : isWinnerCorrect ? "text-accent" : result ? "text-destructive" : "text-foreground"
                    }`}>
                      {pickedName}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {getMethodLabel(pred.method)}{pred.round ? ` R${pred.round}` : ""}
                    </span>
                    {isCancelled && <Badge variant="secondary" className="text-[10px]">Cancelada</Badge>}
                    {!isCancelled && isMethodCorrect && <Badge className="text-[10px] bg-green-500 text-white border-0">✓✓</Badge>}
                    {!isCancelled && isWinnerCorrect && !isMethodCorrect && <Badge variant="default" className="text-[10px] bg-accent text-accent-foreground">✓</Badge>}
                    {!isCancelled && result && !isWinnerCorrect && <Badge variant="destructive" className="text-[10px]">✗</Badge>}
                    {!result && <span className="text-muted-foreground text-[10px] italic">Aguardando</span>}
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs italic">Sem palpite</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalWithResult === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Os resultados ainda não foram lançados para este evento.
        </p>
      )}
    </div>
  );
}
