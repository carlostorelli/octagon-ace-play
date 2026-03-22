import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Loader2, Instagram, Crown, ChevronUp, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import UserBadges from "@/components/UserBadges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CURRENT_SEASON = "2026";

const MONTH_NAMES: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

interface RankedEntry {
  rank: number;
  user: string;
  points: number;
  wins: number;
  avatarUrl: string | null;
  instagram: string | null;
  verified: boolean;
  avatar: string;
  userId: string;
  change: number | null; // positive = moved up, negative = moved down, null = new entry
}

const mapEntries = (data: any[]): RankedEntry[] =>
  data.map((entry, i) => ({
    rank: i + 1,
    user: (entry.profiles as any)?.display_name || "Anônimo",
    points: entry.points,
    wins: entry.wins,
    avatarUrl: (entry.profiles as any)?.avatar_url || null,
    instagram: (entry.profiles as any)?.instagram || null,
    verified: (entry.profiles as any)?.verified || false,
    avatar: ((entry.profiles as any)?.display_name || "??").slice(0, 2).toUpperCase(),
    userId: entry.user_id,
    change: null,
  }));

const PositionChange = ({ change }: { change: number | null }) => {
  if (change === null || change === 0) return null;
  if (change > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-400">
      <ChevronUp className="h-3.5 w-3.5" />
      {change}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-400">
      <ChevronDown className="h-3.5 w-3.5" />
      {Math.abs(change)}
    </span>
  );
};

const LEADERBOARD_ORDER = [
  { column: "points", ascending: false },
  { column: "wins", ascending: false },
  { column: "correct_methods", ascending: false },
  { column: "correct_rounds", ascending: false },
  { column: "main_event_winner", ascending: false },
  { column: "main_event_method", ascending: false },
  { column: "main_event_round", ascending: false },
  { column: "fotn_correct", ascending: false },
  { column: "potn_correct", ascending: false },
  { column: "zebra_count", ascending: false },
];

const Podium = ({ data }: { data: RankedEntry[] }) => {
  if (data.length < 3) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {[1, 0, 2].map((orderIdx, i) => {
        const e = data[orderIdx];
        if (!e) return null;
        const isFirst = orderIdx === 0;
        return (
          <motion.div
            key={e.rank}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`glass-card rounded-xl p-3 sm:p-6 text-center ${isFirst ? "border-accent/30 -mt-4" : ""}`}
          >
            <div className={`mx-auto mb-2 sm:mb-3 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full overflow-hidden ${
              isFirst ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {e.avatarUrl ? (
                <img src={e.avatarUrl} alt={e.user} className="h-full w-full object-cover" />
              ) : isFirst ? <Trophy className="h-7 w-7" /> : <Medal className="h-6 w-6" />}
            </div>
            <div className="font-display text-xl sm:text-2xl font-bold flex items-center justify-center gap-1">
              {e.rank}º
              <PositionChange change={e.change} />
            </div>
            <div className="font-semibold mt-1 text-xs sm:text-sm truncate max-w-full flex items-center justify-center gap-1">
              {e.user}
              <UserBadges verified={e.verified} rank={e.rank} />
            </div>
            {e.instagram && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Instagram className="h-3 w-3" /> {e.instagram}
              </div>
            )}
            <div className="text-accent font-display text-sm sm:text-lg font-bold mt-2">{e.points.toLocaleString()} pts</div>
            <div className="text-xs text-muted-foreground mt-1">{e.wins} vitórias</div>
          </motion.div>
        );
      })}
    </div>
  );
};

const RankingTable = ({ data }: { data: RankedEntry[] }) => (
  <div className="glass-card rounded-xl overflow-hidden">
    <div className="divide-y divide-border">
      {data.map((entry, i) => (
        <motion.div
          key={`${entry.rank}-${entry.user}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center w-8">
              <span className={`font-display text-lg font-bold text-center ${
                entry.rank === 1 ? "text-accent" : entry.rank <= 3 ? "text-primary" : "text-muted-foreground"
              }`}>
                {entry.rank}
              </span>
              <PositionChange change={entry.change} />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold overflow-hidden">
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt={entry.user} className="h-full w-full object-cover" />
              ) : entry.avatar}
            </div>
            <div>
              <span className="font-semibold flex items-center gap-1">
                {entry.user}
                <UserBadges verified={entry.verified} rank={entry.rank} />
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{entry.wins} vitórias</span>
                {entry.instagram && (
                  <span className="flex items-center gap-0.5"><Instagram className="h-3 w-3" /> {entry.instagram}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="font-display text-lg font-bold">{entry.points.toLocaleString()}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 text-muted-foreground">
    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
    <p className="font-display text-lg">{message}</p>
  </div>
);

const LeaderboardPage = () => {
  const [season, setSeason] = useState(CURRENT_SEASON);

  // Fetch available seasons
  const { data: seasons = [] } = useQuery({
    queryKey: ["leaderboard-seasons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leaderboard").select("season");
      if (error) throw error;
      const unique = [...new Set((data ?? []).map((r: any) => r.season).filter(Boolean))].sort().reverse();
      return unique.length > 0 ? unique : [CURRENT_SEASON];
    },
  });

  // General ranking
  const { data: rankingGeral = [], isLoading: loadingGeral } = useQuery({
    queryKey: ["leaderboard-geral", season],
    queryFn: async () => {
      let q = supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name, avatar_url, instagram, verified)")
        .is("event_id", null)
        .eq("season", season);
      for (const o of LEADERBOARD_ORDER) q = q.order(o.column, { ascending: o.ascending });
      const { data, error } = await q.limit(1000);
      if (error) throw error;
      const entries = mapEntries(data ?? []);

      // Calculate position changes: compare with ranking before the most recently processed event
      const { data: latestScoreRow } = await supabase
        .from("leaderboard")
        .select("event_id, updated_at")
        .not("event_id", "is", null)
        .eq("season", season)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const latestEventRows: { event_id: string }[] = latestScoreRow?.event_id
        ? [{ event_id: latestScoreRow.event_id }]
        : [];

      if (latestEventRows && latestEventRows.length > 0) {
        const latestEventId = latestEventRows[0].event_id;
        // Fetch full event scores with all tiebreaker fields
        const { data: fullEventScores } = await supabase
          .from("leaderboard")
          .select("user_id, points, wins, correct_methods, correct_rounds, main_event_winner, main_event_method, main_event_round, fotn_correct, potn_correct, zebra_count")
          .eq("event_id", latestEventId)
          .eq("season", season);

        if (fullEventScores && fullEventScores.length > 0) {
          const fullEsMap: Record<string, any> = {};
          for (const es of fullEventScores) fullEsMap[es.user_id] = es;

          // Build map of full current data for tiebreaker fields
          const fullDataMap: Record<string, any> = {};
          for (const d of (data ?? [])) fullDataMap[d.user_id] = d;

          // Calculate previous ranking by subtracting all fields
          const previousEntries = entries
            .map((e) => {
              const full = fullDataMap[e.userId] || {};
              const evs = fullEsMap[e.userId] || {};
              return {
                userId: e.userId,
                points: e.points - (evs.points ?? 0),
                wins: e.wins - (evs.wins ?? 0),
                correct_methods: (full.correct_methods ?? 0) - (evs.correct_methods ?? 0),
                correct_rounds: (full.correct_rounds ?? 0) - (evs.correct_rounds ?? 0),
                main_event_winner: (full.main_event_winner ? 1 : 0) - (evs.main_event_winner ? 1 : 0),
                main_event_method: (full.main_event_method ? 1 : 0) - (evs.main_event_method ? 1 : 0),
                main_event_round: (full.main_event_round ? 1 : 0) - (evs.main_event_round ? 1 : 0),
                fotn_correct: (full.fotn_correct ? 1 : 0) - (evs.fotn_correct ? 1 : 0),
                potn_correct: (full.potn_correct ? 1 : 0) - (evs.potn_correct ? 1 : 0),
                zebra_count: (full.zebra_count ?? 0) - (evs.zebra_count ?? 0),
              };
            })
            .filter((e) => e.points > 0 || e.wins > 0)
            .sort((a, b) =>
              (b.points - a.points) ||
              (b.wins - a.wins) ||
              (b.correct_methods - a.correct_methods) ||
              (b.correct_rounds - a.correct_rounds) ||
              (b.main_event_winner - a.main_event_winner) ||
              (b.main_event_method - a.main_event_method) ||
              (b.main_event_round - a.main_event_round) ||
              (b.fotn_correct - a.fotn_correct) ||
              (b.potn_correct - a.potn_correct) ||
              (b.zebra_count - a.zebra_count)
            );

          const previousRankMap: Record<string, number> = {};
          previousEntries.forEach((e, i) => {
            previousRankMap[e.userId] = i + 1;
          });

          // Set change on each entry
          for (const entry of entries) {
            const prevRank = previousRankMap[entry.userId];
            if (prevRank === undefined) {
              entry.change = null; // new entry (first event)
            } else {
              entry.change = prevRank - entry.rank; // positive = moved up
            }
          }
        }
      }

      return entries;
    },
  });

  // Events with leaderboard data for this season
  const { data: completedEvents = [] } = useQuery({
    queryKey: ["lb-events", season],
    queryFn: async () => {
      const { data: lbEvents, error: lbError } = await supabase
        .from("leaderboard")
        .select("event_id, updated_at")
        .not("event_id", "is", null)
        .eq("season", season);
      if (lbError) throw lbError;
      // Get unique event_ids with their latest updated_at (processing time)
      const eventMap: Record<string, string> = {};
      for (const row of (lbEvents ?? [])) {
        const eid = row.event_id as string;
        if (!eventMap[eid] || row.updated_at > eventMap[eid]) {
          eventMap[eid] = row.updated_at;
        }
      }
      const eventIds = Object.keys(eventMap);
      if (eventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("events")
        .select("id, name, date")
        .in("id", eventIds);
      if (error) throw error;
      // Sort by processing time (most recently scored first)
      return (data ?? []).sort((a, b) => (eventMap[b.id] || "").localeCompare(eventMap[a.id] || ""));
    },
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const activeEventId = selectedEventId || completedEvents[0]?.id || null;

  // Event ranking
  const { data: rankingEvento = [], isLoading: loadingEvento } = useQuery({
    queryKey: ["leaderboard-evento", activeEventId],
    enabled: !!activeEventId,
    queryFn: async () => {
      let q = supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name, avatar_url, instagram, verified)")
        .eq("event_id", activeEventId!)
        .eq("season", season);
      for (const o of LEADERBOARD_ORDER) q = q.order(o.column, { ascending: o.ascending });
      const { data, error } = await q.limit(1000);
      if (error) throw error;
      return mapEntries(data ?? []);
    },
  });

  // Monthly champion data: fetch all per-event entries + event dates for the season
  const { data: monthlyRaw = [] } = useQuery({
    queryKey: ["leaderboard-monthly-raw", season],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("user_id, points, wins, event_id, profiles!inner(display_name, avatar_url, instagram, verified)")
        .not("event_id", "is", null)
        .eq("season", season);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: eventsForMonthly = [] } = useQuery({
    queryKey: ["events-for-monthly", season],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, date");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Compute monthly aggregations
  const eventMonthMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of eventsForMonthly) {
      // date is YYYY-MM-DD, extract YYYY-MM
      map[e.id] = (e.date as string).slice(0, 7);
    }
    return map;
  }, [eventsForMonthly]);

  const monthlyData = useMemo(() => {
    // Group entries by month, then by user, sum points
    const byMonth: Record<string, Record<string, { points: number; wins: number; profile: any }>> = {};
    for (const entry of monthlyRaw as any[]) {
      const month = eventMonthMap[entry.event_id];
      if (!month) continue;
      if (!byMonth[month]) byMonth[month] = {};
      if (!byMonth[month][entry.user_id]) {
        byMonth[month][entry.user_id] = { points: 0, wins: 0, profile: entry.profiles };
      }
      byMonth[month][entry.user_id].points += entry.points;
      byMonth[month][entry.user_id].wins += entry.wins;
    }

    // Convert to sorted arrays per month
    const result: Record<string, RankedEntry[]> = {};
    for (const [month, users] of Object.entries(byMonth)) {
      const sorted = Object.entries(users)
        .sort((a, b) => b[1].points - a[1].points || b[1].wins - a[1].wins)
        .map(([userId, data], i) => ({
          rank: i + 1,
          user: data.profile?.display_name || "Anônimo",
          points: data.points,
          wins: data.wins,
          avatarUrl: data.profile?.avatar_url || null,
          instagram: data.profile?.instagram || null,
          verified: data.profile?.verified || false,
          avatar: (data.profile?.display_name || "??").slice(0, 2).toUpperCase(),
          userId: userId,
          change: null,
        }));
      result[month] = sorted;
    }
    return result;
  }, [monthlyRaw, eventMonthMap]);

  const availableMonths = useMemo(
    () => Object.keys(monthlyData).sort().reverse(),
    [monthlyData]
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const activeMonth = selectedMonth || availableMonths[0] || null;
  const monthEntries = activeMonth ? monthlyData[activeMonth] ?? [] : [];

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Ranking</h1>
            <p className="text-muted-foreground">Classificação atualizada por pontuação total</p>
          </div>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Temporada" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((s) => (
                <SelectItem key={s} value={s}>Temporada {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <Tabs defaultValue="geral">
          <TabsList className="mb-4">
            <TabsTrigger value="geral">Ranking Geral</TabsTrigger>
            <TabsTrigger value="evento">Por Evento</TabsTrigger>
            <TabsTrigger value="mensal">
              <Crown className="h-4 w-4 mr-1.5" /> Campeão do Mês
            </TabsTrigger>
          </TabsList>

          {/* ── Ranking Geral ── */}
          <TabsContent value="geral" className="space-y-6">
            {loadingGeral ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : rankingGeral.length === 0 ? (
              <EmptyState message={`Nenhum dado de ranking para a Temporada ${season}`} />
            ) : (
              <>
                <Podium data={rankingGeral} />
                <RankingTable data={rankingGeral} />
              </>
            )}
          </TabsContent>

          {/* ── Por Evento ── */}
          <TabsContent value="evento" className="space-y-6">
            {completedEvents.length === 0 ? (
              <EmptyState message="Nenhum evento com ranking calculado nesta temporada" />
            ) : (
              <>
                <Select value={activeEventId ?? ""} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecionar evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedEvents.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingEvento ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : rankingEvento.length === 0 ? (
                  <EmptyState message="Nenhum dado para este evento" />
                ) : (
                  <>
                    <Podium data={rankingEvento} />
                    <RankingTable data={rankingEvento} />
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Campeão do Mês ── */}
          <TabsContent value="mensal" className="space-y-6">
            {availableMonths.length === 0 ? (
              <EmptyState message="Nenhum dado mensal disponível nesta temporada" />
            ) : (
              <>
                <Select value={activeMonth ?? ""} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecionar mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((m) => {
                      const [year, month] = m.split("-");
                      return (
                        <SelectItem key={m} value={m}>
                          {MONTH_NAMES[month] || month} {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {monthEntries.length > 0 && monthEntries[0] && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl p-6 text-center border-accent/20">
                    <Crown className="h-8 w-8 text-accent mx-auto mb-2" />
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Campeão do Mês</p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-bold overflow-hidden">
                        {monthEntries[0].avatarUrl ? (
                          <img src={monthEntries[0].avatarUrl} alt={monthEntries[0].user} className="h-full w-full object-cover" />
                        ) : monthEntries[0].avatar}
                      </div>
                      <div className="text-left">
                        <p className="font-display text-2xl font-bold uppercase flex items-center gap-1">
                          {monthEntries[0].user}
                          <UserBadges verified={monthEntries[0].verified} rank={1} />
                        </p>
                        <p className="text-accent font-display text-lg font-bold">{monthEntries[0].points.toLocaleString()} pts</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <RankingTable data={monthEntries} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default LeaderboardPage;
