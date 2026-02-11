import { motion } from "framer-motion";
import { Calendar, Users, Trophy, Swords, TrendingUp, Loader2, LogOut, ArrowRight, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  // Fetch main card fights for the highlight
  const { data: mainFights = [] } = useQuery({
    queryKey: ["round-highlight-fights", nextEvent?.id],
    enabled: !!nextEvent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_fighters")
        .select("fighter_id, card_type, fight_order, fighters(name, country, salary, weight_class)")
        .eq("event_id", nextEvent!.id)
        .eq("card_type", "main")
        .order("fight_order", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [eventsRes, fightersRes] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("fighters").select("id", { count: "exact", head: true }),
      ]);
      return {
        eventsCount: eventsRes.count ?? 0,
        fightersCount: fightersRes.count ?? 0,
      };
    },
  });

  const { data: leaderboardPreview = [] } = useQuery({
    queryKey: ["leaderboard-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name)")
        .order("points", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data.map((entry, i) => ({
        rank: i + 1,
        user: (entry.profiles as any)?.display_name || "Anônimo",
        points: entry.points,
        wins: entry.wins,
        avatar: ((entry.profiles as any)?.display_name || "??").slice(0, 2).toUpperCase(),
      }));
    },
  });

  // Fallback mock for leaderboard
  const topEntries = leaderboardPreview.length > 0 ? leaderboardPreview : [
    { rank: 1, user: "Carlos S.", points: 2450, wins: 8, avatar: "CS" },
    { rank: 2, user: "Ana P.", points: 2380, wins: 7, avatar: "AP" },
    { rank: 3, user: "João M.", points: 2210, wins: 7, avatar: "JM" },
    { rank: 4, user: "Pedro L.", points: 2100, wins: 6, avatar: "PL" },
    { rank: 5, user: "Maria R.", points: 1980, wins: 5, avatar: "MR" },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Trophy} label="Seus Pontos" value="—" accent />
          <StatCard icon={TrendingUp} label="Ranking Geral" value="—" />
          <StatCard icon={Swords} label="Lutadores" value={String(stats?.fightersCount ?? 0)} />
          <StatCard icon={Calendar} label="Eventos" value={String(stats?.eventsCount ?? 0)} />
        </div>

        {/* Round Highlight */}
        {nextEvent && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-card rounded-xl overflow-hidden relative">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs uppercase tracking-widest text-primary">&gt; Rodada Ativa</span>
                      <div className="flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        Escalação Aberta
                      </div>
                    </div>
                    <h2 className="font-display text-3xl font-bold uppercase tracking-tight">{nextEvent.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{nextEvent.date}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{nextEvent.location}</span>
                      <span className="flex items-center gap-1.5"><Swords className="h-3.5 w-3.5" />{nextEvent.fights_count} lutas</span>
                    </div>
                  </div>
                  <Link to="/lineup">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider glow">
                      Escalar Time <ArrowRight className="h-4 w-4 ml-2" />
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

                {/* Top fights preview */}
                {mainFights.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block">Lutas Principais</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(() => {
                        // Group fighters by fight_order into pairs
                        const fightGroups: Record<number, any[]> = {};
                        mainFights.forEach((f: any) => {
                          const order = f.fight_order;
                          if (!fightGroups[order]) fightGroups[order] = [];
                          fightGroups[order].push(f);
                        });
                        return Object.entries(fightGroups).slice(0, 4).map(([order, fighters]) => (
                          <div key={order} className="rounded-lg bg-secondary/50 border border-border/50 p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{(fighters[0]?.fighters as any)?.country}</span>
                              <span className="font-display text-sm font-bold uppercase">{(fighters[0]?.fighters as any)?.name}</span>
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">vs</span>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-bold uppercase">{(fighters[1]?.fighters as any)?.name ?? "TBD"}</span>
                              <span className="text-sm">{(fighters[1]?.fighters as any)?.country}</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 pb-4">
            <h2 className="font-display text-xl font-bold uppercase flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> Top 5 Ranking
            </h2>
          </div>
          <div className="px-6 pb-6">
            <div className="space-y-2">
              {topEntries.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                    entry.rank <= 3 ? "bg-primary/5 border border-primary/10" : "bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-display text-lg font-bold w-6 text-center ${
                      entry.rank === 1 ? "text-accent" : entry.rank <= 3 ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {entry.rank}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                      {entry.avatar}
                    </div>
                    <span className="font-medium">{entry.user}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-bold">{entry.points.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">{entry.wins}W</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
