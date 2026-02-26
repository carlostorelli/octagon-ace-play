import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Swords, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/lib/useDebounce";

const EventsPage = () => {
  const [search, setSearch] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const debouncedSearch = useDebounce(search, 250);
  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.main_event.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.location.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Eventos UFC</h1>
            <p className="text-muted-foreground">Rodadas disponíveis para escalação</p>
          </div>
          <div className="w-full sm:w-72">
            <OSSInput
              variant="search"
              inputSize="sm"
              placeholder="Buscar evento ou lutador..."
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
            {filtered.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors"
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
                </div>
              </motion.div>
            ))}

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

export default EventsPage;
