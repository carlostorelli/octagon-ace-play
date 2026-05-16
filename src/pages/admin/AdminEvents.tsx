import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Swords, Users, Trophy } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", date: "", location: "", main_event: "", fights_count: 14, status: "upcoming", predictions_open_at: "", predictions_close_at: "", preview_notes: "", preview_pdf_url: "", preview_video_url: "" });

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
      const toUtcIso = (value: string) => {
        if (!value) return null;
        const d = new Date(value);
        if (isNaN(d.getTime())) throw new Error("Data/hora inválida");
        if (d.getFullYear() < 2000 || d.getFullYear() > 2100) {
          throw new Error(`Ano inválido (${d.getFullYear()}). Use o formato AAAA (ex: 2026).`);
        }
        return d.toISOString();
      };
      const payload = {
        ...form,
        predictions_open_at: toUtcIso(form.predictions_open_at),
        predictions_close_at: toUtcIso(form.predictions_close_at),
      };
      if (editing) {
        const { error } = await supabase.from("events").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Evento atualizado!" : "Evento criado!" });
      setEditing(null);
      setForm({ name: "", date: "", location: "", main_event: "", fights_count: 14, status: "upcoming", predictions_open_at: "", predictions_close_at: "", preview_notes: "", preview_pdf_url: "", preview_video_url: "" });
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
    const toDateTimeLocal = (value: string | null) => {
      if (!value) return "";
      const d = new Date(value);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };

    setForm({
      name: event.name, date: event.date, location: event.location, main_event: event.main_event,
      fights_count: event.fights_count, status: event.status,
      predictions_open_at: toDateTimeLocal(event.predictions_open_at),
      predictions_close_at: toDateTimeLocal(event.predictions_close_at),
      preview_notes: event.preview_notes || "",
      preview_pdf_url: event.preview_pdf_url || "",
      preview_video_url: event.preview_video_url || "",
    });
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
            <OSSInput label="Palpites abrem em" type="datetime-local" value={form.predictions_open_at} onChange={(e) => setForm({ ...form, predictions_open_at: e.target.value })} />
            <OSSInput label="Palpites fecham em" type="datetime-local" value={form.predictions_close_at} onChange={(e) => setForm({ ...form, predictions_close_at: e.target.value })} />
            <OSSInput label="Link PDF Análise" placeholder="https://drive.google.com/..." value={form.preview_pdf_url} onChange={(e) => setForm({ ...form, preview_pdf_url: e.target.value })} />
            <OSSInput label="Vídeo YouTube" placeholder="https://www.youtube.com/watch?v=..." value={form.preview_video_url} onChange={(e) => setForm({ ...form, preview_video_url: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Previsões do OSS (Estratégia)</label>
            <textarea
              className="mt-1.5 w-full min-h-[100px] rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Análise estratégica, quem deve ganhar, azarões, etc..."
              value={form.preview_notes}
              onChange={(e) => setForm({ ...form, preview_notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editing ? "Salvar" : "Criar Evento"}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => { setEditing(null); setForm({ name: "", date: "", location: "", main_event: "", fights_count: 14, status: "upcoming", predictions_open_at: "", predictions_close_at: "", preview_notes: "", preview_pdf_url: "", preview_video_url: "" }); }}>
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
                  <Link to={`/admin/events/${event.id}/fights`}>
                    <Button size="sm" variant="ghost" className="text-primary" title="Gerenciar Lutas"><Swords className="h-4 w-4" /></Button>
                  </Link>
                  <Link to={`/admin/events/${event.id}/card`}>
                    <Button size="sm" variant="ghost" className="text-accent" title="Card / Previsões"><Users className="h-4 w-4" /></Button>
                  </Link>
                  <Link to={`/admin/events/${event.id}/results`}>
                    <Button size="sm" variant="ghost" className="text-accent" title="Dar Baixa nos Resultados"><Trophy className="h-4 w-4" /></Button>
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
