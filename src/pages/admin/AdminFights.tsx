import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const FIGHT_TYPES = [
  { value: "3_rounds", label: "3 Rounds" },
  { value: "5_rounds", label: "5 Rounds" },
  { value: "title", label: "Disputa de Cinturão" },
];

const AdminFights = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [fighterAId, setFighterAId] = useState("");
  const [fighterBId, setFighterBId] = useState("");
  const [fightType, setFightType] = useState("3_rounds");
  const [cardType, setCardType] = useState("main");
  const [fightOrder, setFightOrder] = useState(1);
  const [oddsA, setOddsA] = useState("");
  const [oddsB, setOddsB] = useState("");

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

  const { data: allFighters = [] } = useQuery({
    queryKey: ["admin-all-fighters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fighters").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fighters already assigned in this event
  const assignedIds = fights.flatMap((f: any) => [f.fighter_a_id, f.fighter_b_id]);
  const availableFighters = allFighters.filter((f: any) => !assignedIds.includes(f.id));

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!fighterAId || !fighterBId) throw new Error("Selecione os dois lutadores");
      if (fighterAId === fighterBId) throw new Error("Lutadores devem ser diferentes");
      const { error } = await supabase.from("fights").insert({
        event_id: eventId!,
        fighter_a_id: fighterAId,
        fighter_b_id: fighterBId,
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
      setFighterAId("");
      setFighterBId("");
      setOddsA("");
      setOddsB("");
      setFightOrder((prev) => prev + 1);
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Lutador A</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={fighterAId}
                onChange={(e) => setFighterAId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {availableFighters.filter((f: any) => f.id !== fighterBId).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.country} {f.name} ({f.weight_class})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Lutador B</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={fighterBId}
                onChange={(e) => setFighterBId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {availableFighters.filter((f: any) => f.id !== fighterAId).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.country} {f.name} ({f.weight_class})</option>
                ))}
              </select>
            </div>
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
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !fighterAId || !fighterBId}>
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar Luta
          </Button>
        </div>

        {/* Fights list */}
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
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <span className="text-lg mr-1">{fight.fighter_a?.country}</span>
                                        <span className="font-display font-bold uppercase">{fight.fighter_a?.name}</span>
                                        {fight.odds_fighter_a != null && (
                                          <span className="text-xs text-muted-foreground ml-1">({fight.odds_fighter_a > 0 ? "+" : ""}{fight.odds_fighter_a})</span>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold text-primary px-2">VS</span>
                                      <div>
                                        <span className="font-display font-bold uppercase">{fight.fighter_b?.name}</span>
                                        <span className="text-lg ml-1">{fight.fighter_b?.country}</span>
                                        {fight.odds_fighter_b != null && (
                                          <span className="text-xs text-muted-foreground ml-1">({fight.odds_fighter_b > 0 ? "+" : ""}{fight.odds_fighter_b})</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-2">{fightTypeLabel(fight.fight_type)}</span>
                                  </div>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMutation.mutate(fight.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
      </motion.div>
    </AdminLayout>
  );
};

export default AdminFights;
