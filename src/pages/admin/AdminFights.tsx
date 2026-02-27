import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, GripVertical, ClipboardPaste, Pencil } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FighterPicker from "@/components/admin/FighterPicker";

function parseBulkFights(text: string): { fighterA: string; oddsA: number | null; fighterB: string; oddsB: number | null; cardType: string }[] {
  const lines = text.trim().split("\n");
  const results: { fighterA: string; oddsA: number | null; fighterB: string; oddsB: number | null; cardType: string }[] = [];
  let currentCard = "main";
  let hasSeenFight = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Blank line: switch to prelim if we already have fights
      if (hasSeenFight) currentCard = "prelim";
      continue;
    }

    // Detect explicit headers
    if (/^(card\s*)?principal/i.test(trimmed) || /^main\s*card/i.test(trimmed)) {
      currentCard = "main";
      continue;
    }
    if (/^(card\s*)?prelim/i.test(trimmed) || /^prelim/i.test(trimmed)) {
      currentCard = "prelim";
      continue;
    }

    // Pattern: Name (odds) vs Name (odds)
    const match = trimmed.match(
      /^(.+?)\s*\(([+-]?\d+)\)\s*vs\.?\s*(.+?)\s*\(([+-]?\d+)\)$/i
    );
    if (match) {
      hasSeenFight = true;
      results.push({
        fighterA: match[1].trim(),
        oddsA: parseInt(match[2]),
        fighterB: match[3].trim(),
        oddsB: parseInt(match[4]),
        cardType: currentCard,
      });
    }
  }
  return results;
}

const FIGHT_TYPES = [
  { value: "3_rounds", label: "3 Rounds" },
  { value: "5_rounds", label: "5 Rounds" },
  { value: "title", label: "Disputa de Cinturão" },
];

async function findOrCreateFighter(name: string): Promise<string> {
  const trimmed = name.trim();
  // Try to find existing fighter by name (case-insensitive)
  const { data: existing } = await supabase
    .from("fighters")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing) return existing.id;
  // Create new fighter
  const { data: created, error } = await supabase
    .from("fighters")
    .insert({ name: trimmed })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

const AdminFights = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [fighterA, setFighterA] = useState<{ id: string; name: string } | null>(null);
  const [fighterB, setFighterB] = useState<{ id: string; name: string } | null>(null);
  const [fightType, setFightType] = useState("3_rounds");
  const [cardType, setCardType] = useState("main");
  const [fightOrder, setFightOrder] = useState(1);
  const [oddsA, setOddsA] = useState("");
  const [oddsB, setOddsB] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [editFight, setEditFight] = useState<any>(null);
  const [editOddsA, setEditOddsA] = useState("");
  const [editOddsB, setEditOddsB] = useState("");
  const [editFightType, setEditFightType] = useState("3_rounds");
  const [editCardType, setEditCardType] = useState("main");

  const openEdit = (fight: any) => {
    setEditFight(fight);
    setEditOddsA(fight.odds_fighter_a != null ? String(fight.odds_fighter_a) : "");
    setEditOddsB(fight.odds_fighter_b != null ? String(fight.odds_fighter_b) : "");
    setEditFightType(fight.fight_type);
    setEditCardType(fight.card_type);
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editFight) return;
      const { error } = await supabase.from("fights").update({
        fight_type: editFightType,
        card_type: editCardType,
        odds_fighter_a: editOddsA ? parseFloat(editOddsA) : null,
        odds_fighter_b: editOddsB ? parseFloat(editOddsB) : null,
      }).eq("id", editFight.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Luta atualizada!" });
      setEditFight(null);
      queryClient.invalidateQueries({ queryKey: ["admin-fights", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const { data: event } = useQuery({
    queryKey: ["admin-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: fights = [], isLoading: loadingFights } = useQuery({
    queryKey: ["admin-fights", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fights")
        .select("*, fighter_a:fighters!fights_fighter_a_id_fkey(*), fighter_b:fighters!fights_fighter_b_id_fkey(*)")
        .eq("event_id", eventId!);
      if (error) throw error;
      return (data ?? []).sort((a: any, b: any) => {
        if (a.card_type !== b.card_type) return a.card_type === "main" ? -1 : 1;
        return a.fight_order - b.fight_order;
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!fighterA || !fighterB) throw new Error("Selecione os dois lutadores");
      let idA = fighterA.id;
      let idB = fighterB.id;
      if (idA === "__new__") idA = await findOrCreateFighter(fighterA.name);
      if (idB === "__new__") idB = await findOrCreateFighter(fighterB.name);
      if (idA === idB) throw new Error("Lutadores devem ser diferentes");
      const { error } = await supabase.from("fights").insert({
        event_id: eventId!,
        fighter_a_id: idA,
        fighter_b_id: idB,
        fight_type: fightType,
        card_type: cardType,
        fight_order: fightOrder,
        odds_fighter_a: oddsA ? parseFloat(oddsA) : null,
        odds_fighter_b: oddsB ? parseFloat(oddsB) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Luta adicionada!" });
      setFighterA(null);
      setFighterB(null);
      setOddsA("");
      setOddsB("");
      setFightOrder((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["admin-fights", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseBulkFights(bulkText);
      if (parsed.length === 0) throw new Error("Nenhuma luta encontrada. Use o formato: Nome (odds) vs Nome (odds)");
      for (let i = 0; i < parsed.length; i++) {
        const f = parsed[i];
        const [idA, idB] = await Promise.all([
          findOrCreateFighter(f.fighterA),
          findOrCreateFighter(f.fighterB),
        ]);
        const { error } = await supabase.from("fights").insert({
          event_id: eventId!,
          fighter_a_id: idA,
          fighter_b_id: idB,
          fight_type: "3_rounds",
          card_type: f.cardType,
          fight_order: i + 1,
          odds_fighter_a: f.oddsA,
          odds_fighter_b: f.oddsB,
        });
        if (error) throw error;
      }
      return parsed.length;
    },
    onSuccess: (count) => {
      toast({ title: `${count} lutas importadas!` });
      setBulkText("");
      setShowBulk(false);
      queryClient.invalidateQueries({ queryKey: ["admin-fights", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fights").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Luta removida" });
      queryClient.invalidateQueries({ queryKey: ["admin-fights", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; fight_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("fights").update({ fight_order: u.fight_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fights", eventId] });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const type = result.source.droppableId;
    const group = fights.filter((f: any) => f.card_type === type);
    const reordered = Array.from(group);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updates = reordered.map((f: any, i: number) => ({ id: f.id, fight_order: i + 1 }));

    queryClient.setQueryData(["admin-fights", eventId], (old: any[]) => {
      if (!old) return old;
      const otherGroup = old.filter((f: any) => f.card_type !== type);
      const updated = reordered.map((f: any, i: number) => ({ ...f, fight_order: i + 1 }));
      return [...otherGroup, ...updated].sort((a: any, b: any) => {
        if (a.card_type !== b.card_type) return a.card_type === "main" ? -1 : 1;
        return a.fight_order - b.fight_order;
      });
    });
    reorderMutation.mutate(updates);
  };

  const fightTypeLabel = (type: string) => FIGHT_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Lutas — {event?.name ?? "..."}
          </h1>
          <p className="text-sm text-muted-foreground">{event?.date} · {event?.location}</p>
        </div>

        {/* Add fight form */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Adicionar Luta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FighterPicker
              label="Lutador A"
              value={fighterA?.name || ""}
              fighterId={fighterA?.id || null}
              onSelect={setFighterA}
              onClear={() => setFighterA(null)}
            />
            <FighterPicker
              label="Lutador B"
              value={fighterB?.name || ""}
              fighterId={fighterB?.id || null}
              onSelect={setFighterB}
              onClear={() => setFighterB(null)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Tipo de Luta</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={fightType}
                onChange={(e) => setFightType(e.target.value)}
              >
                {FIGHT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Card</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
              >
                <option value="main">Principal</option>
                <option value="prelim">Preliminar</option>
              </select>
            </div>
            <OSSInput label="Ordem" type="number" value={String(fightOrder)} onChange={(e) => setFightOrder(parseInt(e.target.value) || 1)} />
            <OSSInput label="Odds A" type="number" placeholder="-150" value={oddsA} onChange={(e) => setOddsA(e.target.value)} />
            <OSSInput label="Odds B" type="number" placeholder="+200" value={oddsB} onChange={(e) => setOddsB(e.target.value)} />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !fighterA || !fighterB}>
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar Luta
          </Button>
        </div>

        {/* Bulk import */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Importar Card Completo</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowBulk(!showBulk)}>
              <ClipboardPaste className="h-4 w-4 mr-1" />
              {showBulk ? "Fechar" : "Colar Card"}
            </Button>
          </div>
          {showBulk && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Cole as lutas no formato: <code className="bg-muted px-1 rounded">Nome (-225) vs Nome (+172)</code><br />
                Separe card principal do preliminar com uma linha em branco.
              </p>
              <textarea
                className="w-full h-48 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 py-2 text-sm text-foreground outline-none font-mono resize-y"
                placeholder={`Brandon Moreno (-225) vs Lone'er Kavanagh (+172)\nDavid Martinez (-295) vs Marlon Vera (+220)\n\nDamian Pinas (-265) vs Wes Schultz (+200)`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              {(() => {
                const parsed = parseBulkFights(bulkText);
                return (
                  <div className="flex items-center gap-3">
                    <Button onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending || !bulkText.trim()}>
                      {bulkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
                      Importar {parsed.length > 0 ? `(${parsed.length} lutas)` : ""}
                    </Button>
                    {parsed.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {parsed.filter(f => f.cardType === "main").length} principal · {parsed.filter(f => f.cardType === "prelim").length} preliminar
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>


        {loadingFights ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-3">
              {["main", "prelim"].map((type) => {
                const group = fights.filter((f: any) => f.card_type === type);
                if (group.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-display text-sm font-bold uppercase tracking-wider ${type === "main" ? "text-primary" : "text-muted-foreground"}`}>
                        {type === "main" ? "Card Principal" : "Card Preliminar"}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <Droppable droppableId={type}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {group.map((fight: any, index: number) => (
                            <Draggable key={fight.id} draggableId={fight.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`glass-card rounded-xl p-4 flex items-center justify-between transition-shadow ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
                                      <GripVertical className="h-5 w-5" />
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground w-6 text-center">{fight.fight_order}</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-display font-bold uppercase">{fight.fighter_a?.name}</span>
                                      {fight.odds_fighter_a != null && (
                                        <span className="text-xs text-muted-foreground">({fight.odds_fighter_a > 0 ? "+" : ""}{fight.odds_fighter_a})</span>
                                      )}
                                      <span className="text-xs font-bold text-primary">VS</span>
                                      <span className="font-display font-bold uppercase">{fight.fighter_b?.name}</span>
                                      {fight.odds_fighter_b != null && (
                                        <span className="text-xs text-muted-foreground">({fight.odds_fighter_b > 0 ? "+" : ""}{fight.odds_fighter_b})</span>
                                      )}
                                      <span className="text-xs text-muted-foreground">· {fightTypeLabel(fight.fight_type)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(fight)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMutation.mutate(fight.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editFight} onOpenChange={(open) => !open && setEditFight(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display uppercase">
                Editar: {editFight?.fighter_a?.name} vs {editFight?.fighter_b?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Tipo de Luta</label>
                <select
                  className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                  value={editFightType}
                  onChange={(e) => setEditFightType(e.target.value)}
                >
                  {FIGHT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Card</label>
                <select
                  className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                  value={editCardType}
                  onChange={(e) => setEditCardType(e.target.value)}
                >
                  <option value="main">Principal</option>
                  <option value="prelim">Preliminar</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <OSSInput label={`Odds ${editFight?.fighter_a?.name}`} type="number" placeholder="-150" value={editOddsA} onChange={(e) => setEditOddsA(e.target.value)} />
                <OSSInput label={`Odds ${editFight?.fighter_b?.name}`} type="number" placeholder="+200" value={editOddsB} onChange={(e) => setEditOddsB(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
                {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminFights;
