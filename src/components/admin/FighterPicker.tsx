import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/lib/useDebounce";
import { User, Plus, Search, Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { toast } from "@/hooks/use-toast";

const WEIGHT_CLASSES = [
  "Strawweight", "Flyweight", "Bantamweight", "Featherweight", "Lightweight",
  "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight",
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight", "Women's Featherweight",
];

interface FighterPickerProps {
  label: string;
  value: string;
  fighterId: string | null;
  onSelect: (fighter: { id: string; name: string }) => void;
  onClear: () => void;
  placeholder?: string;
}

const FighterPicker = ({ label, value, fighterId, onSelect, onClear, placeholder = "Buscar atleta..." }: FighterPickerProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const ref = useRef<HTMLDivElement>(null);

  // New fighter dialog state
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newRecord, setNewRecord] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newWeightClass, setNewWeightClass] = useState("");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  const { data: fighters = [] } = useQuery({
    queryKey: ["fighter-search", debouncedSearch],
    enabled: open && debouncedSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fighters")
        .select("id, name, nickname, record, country, photo_url")
        .ilike("name", `%${debouncedSearch}%`)
        .order("name")
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (fighter: any) => {
    onSelect({ id: fighter.id, name: fighter.name });
    setSearch("");
    setOpen(false);
  };

  const openNewFighterDialog = () => {
    setNewName(search.trim());
    setNewNickname("");
    setNewRecord("");
    setNewCountry("");
    setNewWeightClass("");
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    setOpen(false);
    setShowNewDialog(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPhotoFile(file);
      setNewPhotoPreview(URL.createObjectURL(file));
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Nome é obrigatório");

      const { data: created, error } = await supabase.from("fighters").insert({
        name: newName.trim(),
        nickname: newNickname.trim(),
        record: newRecord.trim(),
        country: newCountry.trim(),
        weight_class: newWeightClass,
      }).select("id").single();
      if (error) throw error;

      if (newPhotoFile) {
        const ext = newPhotoFile.name.split(".").pop();
        const path = `${created.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("fighter-photos").upload(path, newPhotoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("fighter-photos").getPublicUrl(path);
          await supabase.from("fighters").update({ photo_url: `${urlData.publicUrl}?t=${Date.now()}` }).eq("id", created.id);
        }
      }

      return created;
    },
    onSuccess: (created) => {
      toast({ title: "Atleta cadastrado!" });
      queryClient.invalidateQueries({ queryKey: ["fighter-search"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fighters"] });
      onSelect({ id: created.id, name: newName.trim() });
      setSearch("");
      setShowNewDialog(false);
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  return (
    <>
      <div className="relative" ref={ref}>
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display block mb-1.5">{label}</label>
        {fighterId ? (
          <div className="flex items-center gap-2 h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3">
            <span className="font-display font-bold text-sm uppercase flex-1 truncate">{value}</span>
            <button onClick={() => { onClear(); setOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface pl-9 pr-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              placeholder={placeholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
            />
          </div>
        )}

        {open && !fighterId && search.length >= 2 && (
          <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-64 overflow-y-auto">
            {fighters.length > 0 ? (
              <>
                {fighters.map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelect(f)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {f.photo_url ? (
                        <img src={f.photo_url} alt={f.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm uppercase truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[f.record, f.country].filter(Boolean).join(" · ") || "Sem informações"}
                      </p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-border" />
              </>
            ) : (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum atleta encontrado</p>
            )}
            <button
              onClick={openNewFighterDialog}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-secondary transition-colors text-left text-sm text-primary font-medium"
            >
              <Plus className="h-4 w-4" /> Criar "{search.trim()}" como novo atleta
            </button>
          </div>
        )}
      </div>

      {/* New Fighter Registration Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">Cadastrar Novo Atleta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
                {newPhotoPreview ? (
                  <img src={newPhotoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">
                    <Upload className="h-4 w-4" /> {newPhotoPreview ? "Trocar foto" : "Adicionar foto"}
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, até 5MB</p>
              </div>
            </div>

            <OSSInput label="Nome *" placeholder="Ex: Max Holloway" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <OSSInput label="Apelido" placeholder="Ex: Blessed" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <OSSInput label="Record" placeholder="25-7-0" value={newRecord} onChange={(e) => setNewRecord(e.target.value)} />
              <OSSInput label="País" placeholder="🇺🇸 USA" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Categoria</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={newWeightClass}
                onChange={(e) => setNewWeightClass(e.target.value)}
              >
                <option value="">Selecionar...</option>
                {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>

            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newName.trim()}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cadastrar Atleta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FighterPicker;
