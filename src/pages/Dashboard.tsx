import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Trophy, Swords, TrendingUp, Loader2, LogOut, ArrowRight, Clock, MapPin, Lock, Instagram, Megaphone, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const LeaderboardRow = ({ rank, user, points, wins, avatar, avatarUrl, instagram }: { rank: number; user: string; points: number; wins: number; avatar: string; avatarUrl?: string | null; instagram?: string | null }) => (
  <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${rank <= 3 ? "bg-primary/5 border border-primary/10" : "bg-secondary/50"}`}>
    <div className="flex items-center gap-4">
      <span className={`font-display text-lg font-bold w-6 text-center ${rank === 1 ? "text-accent" : rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
        {rank}
      </span>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt={user} className="h-full w-full object-cover" />
        ) : avatar}
      </div>
      <div>
        <span className="font-medium">{user}</span>
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

  // User's own points and rank
  const { data: myStats } = useQuery({
    queryKey: ["my-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get user's general leaderboard entry
      const { data: myEntry } = await supabase
        .from("leaderboard")
        .select("points")
        .is("event_id", null)
        .eq("user_id", user!.id)
        .maybeSingle();

      // Get rank by counting users with more points
      let rank = "—";
      if (myEntry) {
        const { count } = await supabase
          .from("leaderboard")
          .select("id", { count: "exact", head: true })
          .is("event_id", null)
          .gt("points", myEntry.points);
        rank = String((count ?? 0) + 1) + "º";
      }

      return {
        points: myEntry?.points ?? 0,
        rank,
      };
    },
  });

  // Top 10 overall ranking
  const { data: rankingGeral = [] } = useQuery({
    queryKey: ["leaderboard-geral-top10"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name, avatar_url, instagram)")
        .is("event_id", null)
        .order("points", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((entry: any, i: number) => ({
        rank: i + 1,
        user: entry.profiles?.display_name || "Anônimo",
        points: entry.points,
        wins: entry.wins,
        avatarUrl: entry.profiles?.avatar_url || null,
        instagram: entry.profiles?.instagram || null,
        avatar: (entry.profiles?.display_name || "??").slice(0, 2).toUpperCase(),
      }));
    },
  });

  // Completed events for event ranking tab
  const { data: completedEvents = [] } = useQuery({
    queryKey: ["completed-events-for-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, date")
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Top 10 for latest completed event
  const latestEventId = completedEvents[0]?.id;
  const { data: rankingEvento = [] } = useQuery({
    queryKey: ["leaderboard-evento-top10", latestEventId],
    enabled: !!latestEventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name, avatar_url, instagram)")
        .eq("event_id", latestEventId!)
        .order("points", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((entry: any, i: number) => ({
        rank: i + 1,
        user: entry.profiles?.display_name || "Anônimo",
        points: entry.points,
        wins: entry.wins,
        avatarUrl: entry.profiles?.avatar_url || null,
        instagram: entry.profiles?.instagram || null,
        avatar: (entry.profiles?.display_name || "??").slice(0, 2).toUpperCase(),
      }));
    },
  });

  // Dashboard announcement
  const { data: announcement } = useQuery({
    queryKey: ["dashboard-announcement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["announcement_title", "announcement_message", "announcement_active"]);
      if (error) throw error;
      const title = data?.find((s: any) => s.key === "announcement_title")?.value || "";
      const message = data?.find((s: any) => s.key === "announcement_message")?.value || "";
      const active = data?.find((s: any) => s.key === "announcement_active")?.value === "true";
      return active && title ? { title, message } : null;
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
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
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
        {announcement && !announcementDismissed && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm uppercase">{announcement.title}</p>
              {announcement.message && <p className="text-sm text-muted-foreground mt-1">{announcement.message}</p>}
            </div>
            <button onClick={() => setAnnouncementDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
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
                        <div key={fight.id} className="rounded-lg bg-secondary/50 border border-border/50 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{fight.fighter_a?.country}</span>
                            <span className="font-display text-sm font-bold uppercase">{fight.fighter_a?.name}</span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">vs</span>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold uppercase">{fight.fighter_b?.name}</span>
                            <span className="text-sm">{fight.fighter_b?.country}</span>
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
                    <p className="text-xs text-muted-foreground mb-3">
                      Último evento: <span className="font-semibold text-foreground">{completedEvents[0]?.name}</span>
                    </p>
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
            </Tabs>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
