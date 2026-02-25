import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Swords, Clock, CheckCircle, Loader2, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PredictionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get prediction counts per event for this user
  const { data: predCounts = {} } = useQuery({
    queryKey: ["my-prediction-counts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("event_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p) => {
        counts[p.event_id] = (counts[p.event_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.main_event.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Palpites</h1>
            <p className="text-muted-foreground">Seus palpites por evento</p>
          </div>
          <div className="w-full sm:w-72">
            <OSSInput
              variant="search"
              inputSize="sm"
              placeholder="Buscar evento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((event, i) => {
              const userPredCount = predCounts[event.id] || 0;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/predictions/${event.id}`)}
                  className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl font-bold uppercase">{event.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{event.main_event}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      event.status === "upcoming"
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {event.status === "upcoming" ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                      {event.status === "upcoming" ? "Em Breve" : "Finalizado"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {event.date}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</span>
                    <span className="flex items-center gap-1.5"><Swords className="h-4 w-4" /> {event.fights_count} lutas</span>
                    {user && userPredCount > 0 && (
                      <span className="flex items-center gap-1.5 text-accent font-semibold">
                        <Check className="h-4 w-4" /> {userPredCount} palpite{userPredCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum evento encontrado para "{search}"
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PredictionsPage;
