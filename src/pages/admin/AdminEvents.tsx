import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Swords } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", date: "", location: "", main_event: "", fights_count: 14, status: "upcoming" });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.date) throw new Error("Nome e data são obrigatórios");
      if (editing) {
        const { error } = await supabase.from("events").update(form).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Evento atualizado!" : "Evento criado!" });
      setEditing(null);
      setForm({ name: "", date: "", location: "", main_event: "", fights_count: 14, status: "upcoming" });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Evento removido" });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const startEdit = (event: any) => {
    setEditing(event.id);
    setForm({ name: event.name, date: event.date, location: event.location, main_event: event.main_event, fights_count: event.fights_count, status: event.status });
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Gerenciar Eventos</h1>

        {/* Form */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            {editing ? "Editar Evento" : "Novo Evento"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OSSInput label="Nome" placeholder="UFC 310" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <OSSInput label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <OSSInput label="Local" placeholder="Las Vegas, NV" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <OSSInput label="Main Event" placeholder="Fighter A vs Fighter B" value={form.main_event} onChange={(e) => setForm({ ...form, main_event: e.target.value })} />
            <OSSInput label="Nº de Lutas" type="number" value={String(form.fights_count)} onChange={(e) => setForm({ ...form, fights_count: parseInt(e.target.value) || 0 })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Status</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editing ? "Salvar" : "Criar Evento"}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => { setEditing(null); setForm({ name: "", date: "", location: "", main_event: "", fights_count: 14, status: "upcoming" }); }}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {events.map((event: any) => (
              <div key={event.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold uppercase">{event.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === "upcoming" ? "bg-accent/10 text-accent" :
                      event.status === "live" ? "bg-primary/10 text-primary" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.date} · {event.location} · {event.fights_count} lutas</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link to={`/admin/events/${event.id}/card`}>
                    <Button size="sm" variant="ghost" className="text-accent"><Swords className="h-4 w-4" /></Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(event)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(event.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminEvents;
