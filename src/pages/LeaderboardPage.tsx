import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { MOCK_LEADERBOARD } from "@/data/mockData";

const LeaderboardPage = () => {
  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Ranking Geral</h1>
          <p className="text-muted-foreground">Classificação atualizada por pontuação total</p>
        </motion.div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4">
          {MOCK_LEADERBOARD.slice(0, 3).map((entry, i) => {
            const order = [1, 0, 2]; // show 2nd, 1st, 3rd
            const e = MOCK_LEADERBOARD[order[i]];
            const isFirst = order[i] === 0;
            return (
              <motion.div
                key={e.rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`glass-card rounded-xl p-6 text-center ${
                  isFirst ? "border-accent/30 row-span-1 -mt-4" : ""
                }`}
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

        {/* Rest of table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {MOCK_LEADERBOARD.map((entry, i) => (
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
      </div>
    </AppLayout>
  );
};

export default LeaderboardPage;
