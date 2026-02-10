import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

const LeaderboardPage = () => {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles!inner(display_name)")
        .order("points", { ascending: false })
        .limit(50);
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

  // Fallback to mock if no real data
  const displayData = leaderboard.length > 0 ? leaderboard : [
    { rank: 1, user: "Carlos S.", points: 2450, wins: 8, avatar: "CS" },
    { rank: 2, user: "Ana P.", points: 2380, wins: 7, avatar: "AP" },
    { rank: 3, user: "João M.", points: 2210, wins: 7, avatar: "JM" },
    { rank: 4, user: "Pedro L.", points: 2100, wins: 6, avatar: "PL" },
    { rank: 5, user: "Maria R.", points: 1980, wins: 5, avatar: "MR" },
  ];

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
              <div className="grid grid-cols-3 gap-4">
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
                      className={`glass-card rounded-xl p-6 text-center ${isFirst ? "border-accent/30 -mt-4" : ""}`}
                    >
                      <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
                        isFirst ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                        {isFirst ? <Trophy className="h-7 w-7" /> : <Medal className="h-6 w-6" />}
                      </div>
                      <div className="font-display text-2xl font-bold">{e.rank}º</div>
                      <div className="font-semibold mt-1">{e.user}</div>
                      <div className="text-accent font-display text-lg font-bold mt-2">{e.points.toLocaleString()} pts</div>
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                        {entry.avatar}
                      </div>
                      <div>
                        <span className="font-semibold">{entry.user}</span>
                        <p className="text-xs text-muted-foreground">{entry.wins} vitórias</p>
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
