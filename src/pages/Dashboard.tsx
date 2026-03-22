import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Trophy, Swords, TrendingUp, Loader2, LogOut, ArrowRight, Clock, MapPin, Lock, Instagram, Megaphone, X, Crown, ChevronUp, ChevronDown } from "lucide-react";
import UserBadges from "@/components/UserBadges";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTH_NAMES: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) => (
  <div className="glass-card rounded-xl p-5">
    <div className="flex items-center gap-3 mb-2">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <p className="font-display text-3xl font-bold">{value}</p>
  </div>
);

const PositionChange = ({ change }: { change: number | null | undefined }) => {
  if (change === null || change === undefined || change === 0) return null;
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

const LeaderboardRow = ({ rank, user, points, wins, avatar, avatarUrl, instagram, verified, change }: { rank: number; user: string; points: number; wins: number; avatar: string; avatarUrl?: string | null; instagram?: string | null; verified?: boolean; change?: number | null }) => (
  <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${rank <= 3 ? "bg-primary/5 border border-primary/10" : "bg-secondary/50"}`}>
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center w-6">
        <span className={`font-display text-lg font-bold text-center ${rank === 1 ? "text-accent" : rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
          {rank}
        </span>
        <PositionChange change={change} />
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt={user} className="h-full w-full object-cover" />
        ) : avatar}
      </div>
      <div>
        <span className="font-medium flex items-center gap-1">
          {user}
          <UserBadges verified={verified} rank={rank} />
        </span>
        {instagram && (
          <p className="flex items-center gap-0.5 text-xs text-muted-foreground"><Instagram className="h-3 w-3" /> {instagram}</p>
        )}
      </div>
    </div>
    <div className="text-right">
      <span className="font-display font-bold">{points.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground ml-2">{wins}W</span>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: nextEvent } = useQuery({
    queryKey: ["next-event-dashboard"],
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

  // Fetch fights for the next event
  const { data: mainFights = [] } = useQuery({
    queryKey: ["round-highlight-fights", nextEvent?.id],
    enabled: !!nextEvent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fights")
        .select("*, fighter_a:fighters!fights_fighter_a_id_fkey(name, country), fighter_b:fighters!fights_fighter_b_id_fkey(name, country)")
        .eq("event_id", nextEvent!.id)
        .eq("card_type", "main")
        .order("fight_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  const CURRENT_SEASON = "2026";

  // User's own points and rank
  const { data: myStats } = useQuery({
    queryKey: ["my-stats", user?.id, CURRENT_SEASON],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get full sorted leaderboard to determine real rank with tiebreakers
      const { data: allEntries } = await supabase
        .from("leaderboard")
        .select("user_id, points")
        .is("event_id", null)
        .eq("season", CURRENT_SEASON)
        .order("points", { ascending: false })
        .order("wins", { ascending: false })
        .order("correct_methods", { ascending: false })
        .order("correct_rounds", { ascending: false })
        .order("main_event_winner", { ascending: false })
        .order("main_event_method", { ascending: false })
        .order("main_event_round", { ascending: false })
        .order("fotn_correct", { ascending: false })
        .order("potn_correct", { ascending: false })
        .order("zebra_count", { ascending: false });

      const myIndex = (allEntries ?? []).findIndex((e: any) => e.user_id === user!.id);
      const myEntry = myIndex >= 0 ? allEntries![myIndex] : null;

      return {
        points: myEntry?.points ?? 0,
        rank: myIndex >= 0 ? `${myIndex + 1}º` : "—",
      };
    },
  });

  // Top 10 overall ranking with position changes
  const { data: rankingGeral = [] } = useQuery({
    queryKey: ["leaderboard-geral-top10-v4", CURRENT_SEASON],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name, avatar_url, instagram, verified)")
        .is("event_id", null)
        .eq("season", CURRENT_SEASON)
        .order("points", { ascending: false })
        .order("wins", { ascending: false })
        .order("correct_methods", { ascending: false })
        .order("correct_rounds", { ascending: false })
        .order("main_event_winner", { ascending: false })
        .order("main_event_method", { ascending: false })
        .order("main_event_round", { ascending: false })
        .order("fotn_correct", { ascending: false })
        .order("potn_correct", { ascending: false })
        .order("zebra_count", { ascending: false })
        .limit(1000);
      if (error) throw error;

      const allEntries = (data ?? []).map((entry: any, i: number) => ({
        rank: i + 1,
        user: entry.profiles?.display_name || "Anônimo",
        points: entry.points,
        wins: entry.wins,
        avatarUrl: entry.profiles?.avatar_url || null,
        instagram: entry.profiles?.instagram || null,
        verified: entry.profiles?.verified || false,
        avatar: (entry.profiles?.display_name || "??").slice(0, 2).toUpperCase(),
        userId: entry.user_id,
        change: null as number | null,
      }));

      // Calculate position changes based on the most recently processed event
      const { data: latestScoreRow } = await supabase
        .from("leaderboard")
        .select("event_id, updated_at")
        .not("event_id", "is", null)
        .eq("season", CURRENT_SEASON)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestScoreRow?.event_id) {
        const latestEvId = latestScoreRow.event_id;

        // Build a map of full scores from the original query for tiebreaker fields
        const fullDataMap: Record<string, any> = {};
        for (const d of (data ?? [])) fullDataMap[d.user_id] = d;

        // Fetch full event scores with all tiebreaker fields
        const { data: fullEventScores } = await supabase
          .from("leaderboard")
          .select("user_id, points, wins, correct_methods, correct_rounds, main_event_winner, main_event_method, main_event_round, fotn_correct, potn_correct, zebra_count")
          .eq("event_id", latestEvId)
          .eq("season", CURRENT_SEASON);

        if (fullEventScores && fullEventScores.length > 0) {
          const fullEsMap: Record<string, any> = {};
          for (const es of fullEventScores) fullEsMap[es.user_id] = es;

          const prev = allEntries
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

          const prevRankMap: Record<string, number> = {};
          prev.forEach((e, i) => { prevRankMap[e.userId] = i + 1; });

          for (const entry of allEntries) {
            const prevRank = prevRankMap[entry.userId];
            entry.change = prevRank === undefined ? null : prevRank - entry.rank;
          }
        }
      }

      return allEntries.slice(0, 10);
    },
  });

  // Events that have leaderboard data (completed or with results)
  const { data: completedEvents = [] } = useQuery({
    queryKey: ["completed-events-for-ranking", CURRENT_SEASON],
    queryFn: async () => {
      // Get event_ids that have leaderboard entries for current season
      const { data: lbEvents, error: lbError } = await supabase
        .from("leaderboard")
        .select("event_id")
        .not("event_id", "is", null)
        .eq("season", CURRENT_SEASON);
      if (lbError) throw lbError;
      const eventIds = [...new Set((lbEvents ?? []).map((e: any) => e.event_id))];
      if (eventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("events")
        .select("id, name, date")
        .in("id", eventIds)
        .order("date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Event ranking with selector
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const activeEventId = selectedEventId || completedEvents[0]?.id || null;

  const { data: rankingEvento = [] } = useQuery({
    queryKey: ["leaderboard-evento-top10-v5", activeEventId],
    enabled: !!activeEventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name, avatar_url, instagram, verified)")
        .eq("event_id", activeEventId!)
        .eq("season", CURRENT_SEASON)
        .order("points", { ascending: false })
        .order("wins", { ascending: false })
        .order("correct_methods", { ascending: false })
        .order("correct_rounds", { ascending: false })
        .order("main_event_winner", { ascending: false })
        .order("main_event_method", { ascending: false })
        .order("main_event_round", { ascending: false })
        .order("fotn_correct", { ascending: false })
        .order("potn_correct", { ascending: false })
        .order("zebra_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((entry: any, i: number) => ({
        rank: i + 1,
        user: entry.profiles?.display_name || "Anônimo",
        points: entry.points,
        wins: entry.wins,
        avatarUrl: entry.profiles?.avatar_url || null,
        instagram: entry.profiles?.instagram || null,
        verified: entry.profiles?.verified || false,
        avatar: (entry.profiles?.display_name || "??").slice(0, 2).toUpperCase(),
      }));
    },
  });

  // Monthly ranking: fetch per-event entries + event dates for current season
  const { data: monthlyRaw = [] } = useQuery({
    queryKey: ["dashboard-monthly-raw", CURRENT_SEASON],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("user_id, points, wins, event_id, profiles!inner(display_name, avatar_url, instagram, verified)")
        .not("event_id", "is", null)
        .eq("season", CURRENT_SEASON);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: eventsForMonthly = [] } = useQuery({
    queryKey: ["dashboard-events-dates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const eventMonthMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of eventsForMonthly) map[e.id] = (e.date as string).slice(0, 7);
    return map;
  }, [eventsForMonthly]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const entry of monthlyRaw as any[]) {
      const m = eventMonthMap[entry.event_id];
      if (m) months.add(m);
    }
    return [...months].sort().reverse();
  }, [monthlyRaw, eventMonthMap]);

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const activeMonth = selectedMonth || (availableMonths.includes(currentMonth) ? currentMonth : availableMonths[0]) || null;

  const rankingMensal = useMemo(() => {
    if (!activeMonth) return [];
    const userAgg: Record<string, { points: number; wins: number; profile: any }> = {};
    for (const entry of monthlyRaw as any[]) {
      const month = eventMonthMap[entry.event_id];
      if (month !== activeMonth) continue;
      if (!userAgg[entry.user_id]) {
        userAgg[entry.user_id] = { points: 0, wins: 0, profile: entry.profiles };
      }
      userAgg[entry.user_id].points += entry.points;
      userAgg[entry.user_id].wins += entry.wins;
    }

    return Object.entries(userAgg)
      .sort((a, b) => b[1].points - a[1].points || b[1].wins - a[1].wins)
      .slice(0, 10)
      .map(([, data], i) => ({
        rank: i + 1,
        user: data.profile?.display_name || "Anônimo",
        points: data.points,
        wins: data.wins,
        avatarUrl: data.profile?.avatar_url || null,
        instagram: data.profile?.instagram || null,
        verified: data.profile?.verified || false,
        avatar: (data.profile?.display_name || "??").slice(0, 2).toUpperCase(),
      }));
  }, [monthlyRaw, eventMonthMap, activeMonth]);

  // Dashboard announcement
  const { data: announcement } = useQuery({
    queryKey: ["dashboard-announcement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["announcement_title", "announcement_message", "announcement_active", "whatsapp_group_link"]);
      if (error) throw error;
      const title = data?.find((s: any) => s.key === "announcement_title")?.value || "";
      const message = data?.find((s: any) => s.key === "announcement_message")?.value || "";
      const active = data?.find((s: any) => s.key === "announcement_active")?.value === "true";
      const whatsapp = data?.find((s: any) => s.key === "whatsapp_group_link")?.value || "";
      return { announcement: active && title ? { title, message } : null, whatsapp };
    },
  });
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  // Predictions time check
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const predictionsOpen = nextEvent?.predictions_open_at ? new Date(nextEvent.predictions_open_at) : null;
  const predictionsClose = nextEvent?.predictions_close_at ? new Date(nextEvent.predictions_close_at) : null;
  const isBeforeOpen = predictionsOpen && now < predictionsOpen;
  const isAfterClose = predictionsClose && now > predictionsClose;
  const isPredictionsOpen = !isBeforeOpen && !isAfterClose;

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              {user ? `Bem-vindo, ${user.user_metadata?.display_name || user.email}` : "Visão geral do seu fantasy"}
            </p>
          </div>
          {user ? (
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground">
              Entrar
            </Button>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={Trophy} label="Seus Pontos" value={user ? String(myStats?.points ?? 0) : "—"} accent />
          <StatCard icon={TrendingUp} label="Ranking Geral" value={user ? (myStats?.rank ?? "—") : "—"} />
        </div>

        {/* Announcement Banner */}
        {announcement?.announcement && !announcementDismissed && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm uppercase">{announcement.announcement.title}</p>
              {announcement.announcement.message && <p className="text-sm text-muted-foreground mt-1">{announcement.announcement.message}</p>}
            </div>
            <button onClick={() => setAnnouncementDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* WhatsApp Group */}
        {announcement?.whatsapp && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
            <a href={announcement.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4 hover:bg-green-500/10 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-green-500">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-sm uppercase text-green-500">Grupo Secreto do WhatsApp</p>
                <p className="text-xs text-muted-foreground">Entre no grupo para receber notificações de eventos!</p>
              </div>
              <ArrowRight className="h-4 w-4 text-green-500 shrink-0" />
            </a>
          </motion.div>
        )}

        {/* Round Highlight */}
        {nextEvent && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-card rounded-xl overflow-hidden relative">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
              <div className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs uppercase tracking-widest text-primary">&gt; Rodada Ativa</span>
                      {isPredictionsOpen ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                          Palpites Abertos
                        </div>
                      ) : isBeforeOpen ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs font-semibold">
                          <Clock className="h-3 w-3" />
                          Abre em {predictionsOpen!.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-semibold">
                          <Lock className="h-3 w-3" />
                          Palpites Encerrados
                        </div>
                      )}
                    </div>
                    <h2 className="font-display text-3xl font-bold uppercase tracking-tight">{nextEvent.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{nextEvent.date}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{nextEvent.location}</span>
                      <span className="flex items-center gap-1.5"><Swords className="h-3.5 w-3.5" />{nextEvent.fights_count} lutas</span>
                    </div>
                  </div>
                  <Link to="/predictions">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider glow">
                      Fazer Palpites <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                {/* Main Event highlight */}
                {nextEvent.main_event && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Main Event</span>
                    <p className="font-display text-xl font-bold uppercase tracking-wide mt-1">{nextEvent.main_event}</p>
                  </div>
                )}

                {/* Top fights preview from fights table */}
                {mainFights.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block">Lutas Principais</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mainFights.map((fight: any) => (
                        <div key={fight.id} className="rounded-lg bg-secondary/50 border border-border/50 p-3 flex items-center justify-between gap-1 overflow-hidden">
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                            <span className="text-xs sm:text-sm shrink-0">{fight.fighter_a?.country}</span>
                            <span className="font-display text-xs sm:text-sm font-bold uppercase truncate">{fight.fighter_a?.name}</span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground shrink-0 px-1">vs</span>
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 justify-end">
                            <span className="font-display text-xs sm:text-sm font-bold uppercase truncate text-right">{fight.fighter_b?.name}</span>
                            <span className="text-xs sm:text-sm shrink-0">{fight.fighter_b?.country}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard - Top 10 with Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-6">
            <h2 className="font-display text-xl font-bold uppercase flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-accent" /> Top 10 Ranking
            </h2>
            <Tabs defaultValue="geral">
              <TabsList className="mb-4">
                <TabsTrigger value="geral">Ranking Geral</TabsTrigger>
                <TabsTrigger value="evento">Por Evento</TabsTrigger>
                <TabsTrigger value="mensal"><Crown className="h-3.5 w-3.5 mr-1" /> Do Mês</TabsTrigger>
              </TabsList>
              <TabsContent value="geral">
                {rankingGeral.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado no ranking geral ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {rankingGeral.map((entry: any) => (
                      <LeaderboardRow key={entry.rank} {...entry} />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="evento">
                {completedEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento concluído ainda.</p>
                ) : (
                  <>
                    <Select value={activeEventId ?? ""} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="w-full sm:w-[300px] mb-3">
                        <SelectValue placeholder="Selecionar evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {completedEvents.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rankingEvento.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado de ranking para este evento.</p>
                    ) : (
                      <div className="space-y-2">
                        {rankingEvento.map((entry: any) => (
                          <LeaderboardRow key={entry.rank} {...entry} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="mensal">
                {availableMonths.length > 0 && (
                  <Select value={activeMonth ?? ""} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full sm:w-[220px] mb-3">
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
                )}
                {rankingMensal.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado do ranking mensal ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {rankingMensal.map((entry: any) => (
                      <LeaderboardRow key={entry.rank} {...entry} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
