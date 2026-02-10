import { motion } from "framer-motion";
import { Calendar, MapPin, Swords, CheckCircle, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { MOCK_EVENTS } from "@/data/mockData";

const EventsPage = () => {
  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">Eventos UFC</h1>
          <p className="text-muted-foreground">Rodadas disponíveis para escalação</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MOCK_EVENTS.map((event, i) => (
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
                  <p className="text-sm text-muted-foreground mt-1">{event.mainEvent}</p>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  event.status === "upcoming"
                    ? "bg-accent/10 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {event.status === "upcoming" ? (
                    <Clock className="h-3 w-3" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {event.status === "upcoming" ? "Em Breve" : "Finalizado"}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {event.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {event.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Swords className="h-4 w-4" /> {event.fightsCount} lutas
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default EventsPage;
