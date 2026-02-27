import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, Pencil, Upload, Search, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/lib/useDebounce";

const WEIGHT_CLASSES = [
  "Strawweight", "Flyweight", "Bantamweight", "Featherweight", "Lightweight",
  "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight",
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight", "Women's Featherweight",
];

const AdminFighters = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editFighter, setEditFighter] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [record, setRecord] = useState("");
  const [country, setCountry] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data: fighters = [], isLoading } = useQuery({
    queryKey: ["admin-fighters", debouncedSearch],
    queryFn: async () => {
      let query = supabase.from("fighters").select("*").order("name");
      if (debouncedSearch) {
        query = query.ilike("name", `%${debouncedSearch}%`);
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const resetForm = () => {
    setName(""); setNickname(""); setRecord(""); setCountry(""); setWeightClass("");
    setPhotoFile(null); setPhotoPreview(null); setEditFighter(null); setShowForm(false);
  };

  const openEdit = (fighter: any) => {
    setEditFighter(fighter);
    setName(fighter.name); setNickname(fighter.nickname || ""); setRecord(fighter.record || "");
    setCountry(fighter.country || ""); setWeightClass(fighter.weight_class || "");
    setPhotoPreview(fighter.photo_url || null); setPhotoFile(null);
    setShowForm(true);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (fighterId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop();
    const path = `${fighterId}.${ext}`;
    const { error } = await supabase.storage.from("fighter-photos").upload(path, photoFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("fighter-photos").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Nome é obrigatório");

      if (editFighter) {
        let photoUrl = editFighter.photo_url;
        if (photoFile) photoUrl = await uploadPhoto(editFighter.id);
        const { error } = await supabase.from("fighters").update({
          name: name.trim(), nickname: nickname.trim(), record: record.trim(),
          country: country.trim(), weight_class: weightClass, photo_url: photoUrl || "",
        }).eq("id", editFighter.id);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase.from("fighters").insert({
          name: name.trim(), nickname: nickname.trim(), record: record.trim(),
          country: country.trim(), weight_class: weightClass,
        }).select("id").single();
        if (error) throw error;
        if (photoFile) {
          const photoUrl = await uploadPhoto(created.id);
          if (photoUrl) {
            await supabase.from("fighters").update({ photo_url: photoUrl }).eq("id", created.id);
          }
        }
      }
    },
    onSuccess: () => {
      toast({ title: editFighter ? "Atleta atualizado!" : "Atleta cadastrado!" });
      resetForm();
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
      toast({ title: "Atleta removido" });
      queryClient.invalidateQueries({ queryKey: ["admin-fighters"] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Banco de Atletas</h1>
            <p className="text-sm text-muted-foreground">{fighters.length} atletas cadastrados</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Atleta</Button>
        </div>

        {/* Search */}
        <div className="w-full max-w-sm">
          <OSSInput variant="search" inputSize="sm" placeholder="Buscar atleta..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Fighter list */}
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fighters.map((fighter: any) => (
              <div key={fighter.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
                <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                  {fighter.photo_url ? (
                    <img src={fighter.photo_url} alt={fighter.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold uppercase text-sm truncate">{fighter.name}</p>
                  {fighter.nickname && <p className="text-xs text-muted-foreground truncate">"{fighter.nickname}"</p>}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {fighter.record && <span className="text-xs text-muted-foreground">{fighter.record}</span>}
                    {fighter.country && <span className="text-xs">{fighter.country}</span>}
                    {fighter.weight_class && <span className="text-xs text-primary font-medium">{fighter.weight_class}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(fighter)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(fighter.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
            {fighters.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {search ? `Nenhum atleta encontrado para "${search}"` : "Nenhum atleta cadastrado ainda"}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display uppercase">
                {editFighter ? "Editar Atleta" : "Novo Atleta"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Photo upload */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">
                      <Upload className="h-4 w-4" /> {photoPreview ? "Trocar foto" : "Adicionar foto"}
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, até 5MB</p>
                </div>
              </div>

              <OSSInput label="Nome *" placeholder="Ex: Max Holloway" value={name} onChange={(e) => setName(e.target.value)} />
              <OSSInput label="Apelido" placeholder="Ex: Blessed" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <OSSInput label="Record" placeholder="25-7-0" value={record} onChange={(e) => setRecord(e.target.value)} />
                <OSSInput label="País" placeholder="🇺🇸 USA" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Categoria</label>
                <select
                  className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                  value={weightClass}
                  onChange={(e) => setWeightClass(e.target.value)}
                >
                  <option value="">Selecionar...</option>
                  {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
                </select>
              </div>

              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim()}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editFighter ? "Salvar Alterações" : "Cadastrar Atleta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminFighters;
