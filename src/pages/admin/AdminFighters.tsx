import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const WEIGHT_CLASSES = [
  "Flyweight", "Bantamweight", "Featherweight", "Lightweight",
  "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight",
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight", "Women's Featherweight",
];

const AdminFighters = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nickname: "", weight_class: "Lightweight", country: "", record: "", salary: 7000 });

  const { data: fighters = [], isLoading } = useQuery({
    queryKey: ["admin-fighters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fighters").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error("Nome é obrigatório");
      if (editing) {
        const { error } = await supabase.from("fighters").update(form).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fighters").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Lutador atualizado!" : "Lutador criado!" });
      setEditing(null);
      setForm({ name: "", nickname: "", weight_class: "Lightweight", country: "", record: "", salary: 7000 });
      queryClient.invalidateQueries({ queryKey: ["admin-fighters"] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fighters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Lutador removido" });
      queryClient.invalidateQueries({ queryKey: ["admin-fighters"] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const startEdit = (f: any) => {
    setEditing(f.id);
    setForm({ name: f.name, nickname: f.nickname, weight_class: f.weight_class, country: f.country, record: f.record, salary: f.salary });
  };

  const [search, setSearch] = useState("");
  const filtered = fighters.filter((f: any) =>
    f.name.toLowerCase().includes(search.toLowerCase()) || f.weight_class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Gerenciar Lutadores</h1>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            {editing ? "Editar Lutador" : "Novo Lutador"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <OSSInput label="Nome" placeholder="Max Holloway" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <OSSInput label="Apelido" placeholder="Blessed" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Categoria</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={form.weight_class}
                onChange={(e) => setForm({ ...form, weight_class: e.target.value })}
              >
                {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>
            <OSSInput label="País (emoji)" placeholder="🇧🇷" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <OSSInput label="Cartel" placeholder="25-7-0" value={form.record} onChange={(e) => setForm({ ...form, record: e.target.value })} />
            <OSSInput label="Salário Base" type="number" variant="numeric" value={String(form.salary)} onChange={(e) => setForm({ ...form, salary: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editing ? "Salvar" : "Criar Lutador"}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => { setEditing(null); setForm({ name: "", nickname: "", weight_class: "Lightweight", country: "", record: "", salary: 7000 }); }}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        <OSSInput variant="search" inputSize="sm" placeholder="Buscar lutador..." value={search} onChange={(e) => setSearch(e.target.value)} />

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((f: any) => (
              <div key={f.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{f.country}</span>
                  <div>
                    <span className="font-display font-bold uppercase">{f.name}</span>
                    {f.nickname && <span className="text-muted-foreground ml-2 text-sm">"{f.nickname}"</span>}
                    <p className="text-xs text-muted-foreground">{f.weight_class} · {f.record} · ${f.salary.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(f)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(f.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminFighters;
