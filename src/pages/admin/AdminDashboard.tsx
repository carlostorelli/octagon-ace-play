import { motion } from "framer-motion";
import { Calendar, Users, Settings, Trophy, Eye, Swords } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [e, f, sr, fi, p, lb] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("fighters").select("id", { count: "exact", head: true }),
        supabase.from("scoring_rules").select("id", { count: "exact", head: true }),
        supabase.from("fights").select("id", { count: "exact", head: true }),
        supabase.from("predictions").select("id", { count: "exact", head: true }),
        supabase.from("leaderboard").select("id", { count: "exact", head: true }),
      ]);
      return {
        events: e.count ?? 0,
        fighters: f.count ?? 0,
        rules: sr.count ?? 0,
        fights: fi.count ?? 0,
        predictions: p.count ?? 0,
        leaderboard: lb.count ?? 0,
      };
    },
  });

  // Fetch user count via edge function
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { count: 0 };
      const res = await supabase.functions.invoke("admin-users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      return { count: Array.isArray(res.data) ? res.data.length : 0 };
    },
  });

  const cards = [
    { label: "Eventos", count: counts?.events ?? 0, icon: Calendar, path: "/admin/events", color: "text-primary" },
    { label: "Usuários", count: usersData?.count ?? 0, icon: Users, path: "/admin/users", color: "text-accent" },
    { label: "Lutas", count: counts?.fights ?? 0, icon: Swords, path: "/admin/events", color: "text-yellow-400" },
    { label: "Palpites", count: counts?.predictions ?? 0, icon: Eye, path: "/admin/predictions", color: "text-blue-400" },
    { label: "Ranking", count: counts?.leaderboard ?? 0, icon: Trophy, path: "/admin/scoring", color: "text-green-400" },
    { label: "Regras de Pontuação", count: counts?.rules ?? 0, icon: Settings, path: "/admin/scoring", color: "text-success" },
  ];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-6">Painel Administrativo</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link key={c.label} to={c.path}>
              <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors cursor-pointer">
                <c.icon className={`h-8 w-8 mb-3 ${c.color}`} />
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="font-display text-3xl font-bold">{c.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
