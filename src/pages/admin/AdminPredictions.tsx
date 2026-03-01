import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, ChevronDown, ChevronRight, Trophy, Swords, Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const getMethodLabel = (method: string | null) => {
  if (method === "Submission") return "Finalização";
  if (method === "Decision") return "Decisão";
  if (method === "Cancelled") return "Cancelada";
  return method ?? "—";
};

const AdminPredictions = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Fetch events (completed + upcoming with closed predictions)
  const { data: events = [] } = useQuery({
    queryKey: ["admin-events-for-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, date, status")
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch fights for selected event
  const { data: fights = [] } = useQuery({
    queryKey: ["admin-fights", selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fights")
        .select("*, fighter_a:fighters!fights_fighter_a_id_fkey(*), fighter_b:fighters!fights_fighter_b_id_fkey(*)")
        .eq("event_id", selectedEventId)
        .order("fight_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch fight results for selected event
  const { data: results = [] } = useQuery({
    queryKey: ["admin-results", selectedEventId],
    enabled: !!selectedEventId && fights.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fight_results")
        .select("*")
        .in("fight_id", fights.map((f: any) => f.id));
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch all predictions for selected event
  const { data: predictions = [], isLoading: loadingPredictions } = useQuery({
    queryKey: ["admin-all-predictions", selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("event_id", selectedEventId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch profiles
  const userIds = [...new Set(predictions.map((p: any) => p.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch leaderboard for this event
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["admin-leaderboard", selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("event_id", selectedEventId)
        .order("points", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Group predictions by user
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p]));
  const leaderboardMap = Object.fromEntries(leaderboard.map((l: any) => [l.user_id, l]));
  const resultMap = Object.fromEntries(results.map((r: any) => [r.fight_id, r]));
  const fightMap = Object.fromEntries(fights.map((f: any) => [f.id, f]));

  const userPredictions = userIds.map((uid) => {
    const userPreds = predictions.filter((p: any) => p.user_id === uid);
    const profile = profileMap[uid];
    const lb = leaderboardMap[uid];
    return {
      user_id: uid,
      display_name: profile?.display_name ?? "Sem nome",
      avatar_url: profile?.avatar_url,
      points: lb?.points ?? 0,
      wins: lb?.wins ?? 0,
      predictions: userPreds,
      totalPredictions: userPreds.length,
    };
  }).sort((a, b) => b.points - a.points);

  const selectedEvent = events.find((e: any) => e.id === selectedEventId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
              Palpites dos Usuários
            </h1>
          </div>
        </div>

        {/* Event selector */}
        <div className="glass-card rounded-xl p-5 space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Selecione o evento</label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Escolha um evento..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((event: any) => (
                <SelectItem key={event.id} value={event.id}>
                  <span className="flex items-center gap-2">
                    {event.name}
                    <Badge variant={event.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                      {event.status === "completed" ? "Encerrado" : event.status === "upcoming" ? "Próximo" : event.status}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        {selectedEventId && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-primary">{userPredictions.length}</p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-accent">{predictions.length}</p>
              <p className="text-xs text-muted-foreground">Palpites Totais</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{fights.length}</p>
              <p className="text-xs text-muted-foreground">Lutas</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{results.length}</p>
              <p className="text-xs text-muted-foreground">Resultados</p>
            </div>
          </div>
        )}

        {/* Predictions table */}
        {selectedEventId && loadingPredictions && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {selectedEventId && !loadingPredictions && userPredictions.length === 0 && (
          <div className="glass-card rounded-xl p-10 text-center">
            <Eye className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum palpite registrado para este evento.</p>
          </div>
        )}

        {selectedEventId && !loadingPredictions && userPredictions.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-center">Palpites</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-center">Acertos</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPredictions.map((user, idx) => (
                  <UserRow
                    key={user.user_id}
                    user={user}
                    rank={idx + 1}
                    fights={fights}
                    fightMap={fightMap}
                    resultMap={resultMap}
                    isExpanded={expandedUser === user.user_id}
                    onToggle={() => setExpandedUser(expandedUser === user.user_id ? null : user.user_id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

function UserRow({ user, rank, fights, fightMap, resultMap, isExpanded, onToggle }: {
  user: any;
  rank: number;
  fights: any[];
  fightMap: Record<string, any>;
  resultMap: Record<string, any>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const correctPredictions = user.predictions.filter((p: any) => {
    const result = resultMap[p.fight_id];
    return result && result.winner_fighter_id === p.winner_fighter_id;
  }).length;

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell>
          <span className={`font-display font-bold ${rank <= 3 ? "text-accent" : "text-muted-foreground"}`}>
            {rank <= 3 ? <Trophy className="h-4 w-4 inline text-accent" /> : rank}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {user.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="font-medium text-sm">{user.display_name}</span>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant="secondary">{user.totalPredictions}/{fights.length}</Badge>
        </TableCell>
        <TableCell className="text-center font-display font-bold text-primary">{user.points}</TableCell>
        <TableCell className="text-center">
          <span className="text-accent font-bold">{correctPredictions}</span>
          <span className="text-muted-foreground">/{Object.keys(resultMap).length}</span>
        </TableCell>
        <TableCell>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
      </TableRow>
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={6} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/30 p-4 space-y-2">
                  {fights.map((fight: any) => {
                    const pred = user.predictions.find((p: any) => p.fight_id === fight.id);
                    const result = resultMap[fight.id];
                    const isCorrect = result && pred && result.winner_fighter_id === pred.winner_fighter_id;
                    const fighterA = fight.fighter_a;
                    const fighterB = fight.fighter_b;

                    return (
                      <div
                        key={fight.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${
                          !pred
                            ? "border-border bg-background/50"
                            : isCorrect
                            ? "border-accent/30 bg-accent/5"
                            : result
                            ? "border-destructive/30 bg-destructive/5"
                            : "border-border bg-background/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {fighterA?.name} vs {fighterB?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {pred ? (
                            <>
                              <span className={`font-display font-bold uppercase text-xs ${
                                isCorrect ? "text-accent" : result ? "text-destructive" : "text-foreground"
                              }`}>
                                {pred.winner_fighter_id === fighterA?.id ? fighterA?.name : fighterB?.name}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {getMethodLabel(pred.method)}{pred.round ? ` R${pred.round}` : ""}
                              </span>
                              {isCorrect && <Badge variant="default" className="text-[10px] bg-accent text-accent-foreground">✓</Badge>}
                              {result && !isCorrect && <Badge variant="destructive" className="text-[10px]">✗</Badge>}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Sem palpite</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default AdminPredictions;
