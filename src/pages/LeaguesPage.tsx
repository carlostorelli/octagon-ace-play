import { motion } from "framer-motion";
import { Users, Lock, Globe, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { MOCK_LEAGUES } from "@/data/mockData";

const LeaguesPage = () => {
  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Ligas</h1>
            <p className="text-muted-foreground">Encontre ou crie sua liga</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider">
            + Criar Liga
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_LEAGUES.map((league, i) => (
            <motion.div
              key={league.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold uppercase">{league.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      por {league.owner}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  league.type === "public" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                }`}>
                  {league.type === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {league.type === "public" ? "Pública" : "Privada"}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {league.members}/{league.maxMembers}
                  </span>
                  <span className="font-semibold text-accent">{league.prizePool}</span>
                </div>
                <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-secondary font-medium">
                  Entrar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default LeaguesPage;
