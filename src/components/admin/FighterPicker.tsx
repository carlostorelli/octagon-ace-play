import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/lib/useDebounce";
import { User, Plus, Search } from "lucide-react";

interface FighterPickerProps {
  label: string;
  value: string; // fighter name displayed
  fighterId: string | null;
  onSelect: (fighter: { id: string; name: string }) => void;
  onClear: () => void;
  placeholder?: string;
}

const FighterPicker = ({ label, value, fighterId, onSelect, onClear, placeholder = "Buscar atleta..." }: FighterPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const ref = useRef<HTMLDivElement>(null);

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

  const handleCreateNew = () => {
    // Use search text as new fighter name
    if (search.trim()) {
      onSelect({ id: "__new__", name: search.trim() });
      setSearch("");
      setOpen(false);
    }
  };

  return (
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

      {/* Dropdown */}
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
            onClick={handleCreateNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-secondary transition-colors text-left text-sm text-primary font-medium"
          >
            <Plus className="h-4 w-4" /> Criar "{search.trim()}" como novo atleta
          </button>
        </div>
      )}
    </div>
  );
};

export default FighterPicker;
