import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Loader2, Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

const LeaderboardPage = () => {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name, avatar_url, instagram)")
        .is("event_id", null)
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
        .limit(100);
      if (error) throw error;
      return data.map((entry, i) => ({
        rank: i + 1,
        user: (entry.profiles as any)?.display_name || "Anônimo",
        points: entry.points,
        wins: entry.wins,
        avatarUrl: (entry.profiles as any)?.avatar_url || null,
        instagram: (entry.profiles as any)?.instagram || null,
        avatar: ((entry.profiles as any)?.display_name || "??").slice(0, 2).toUpperCase(),
      }));
    },
  });

  const displayData = leaderboard;

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Ranking Geral</h1>
          <p className="text-muted-foreground">Classificação atualizada por pontuação total</p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Top 3 podium */}
            {displayData.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[1, 0, 2].map((orderIdx, i) => {
                  const e = displayData[orderIdx];
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
                      <div className="font-display text-xl sm:text-2xl font-bold">{e.rank}º</div>
                      <div className="font-semibold mt-1 text-xs sm:text-sm truncate max-w-full">{e.user}</div>
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
            )}

            {/* Full table */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {displayData.map((entry, i) => (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-display text-lg font-bold w-8 text-center ${
                        entry.rank === 1 ? "text-accent" : entry.rank <= 3 ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {entry.rank}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold overflow-hidden">
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt={entry.user} className="h-full w-full object-cover" />
                        ) : entry.avatar}
                      </div>
                      <div>
                        <span className="font-semibold">{entry.user}</span>
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
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default LeaderboardPage;
