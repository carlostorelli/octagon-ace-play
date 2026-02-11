import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, Calculator, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { oddsToSalary, formatOdds } from "@/lib/odds-to-salary";

const AdminEventCard = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [selectedFighter, setSelectedFighter] = useState("");
  const [cardType, setCardType] = useState("main");
  const [fightOrder, setFightOrder] = useState(1);
  const [odds, setOdds] = useState(0);

  const { data: event } = useQuery({
    queryKey: ["admin-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: eventFighters = [], isLoading: loadingEF } = useQuery({
    queryKey: ["admin-event-fighters", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_fighters")
        .select("*, fighters(*)")
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

  const assignedIds = eventFighters.map((ef: any) => ef.fighter_id);
  const availableFighters = allFighters.filter((f: any) => !assignedIds.includes(f.id));

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFighter) throw new Error("Selecione um lutador");
      const salary = oddsToSalary(odds);

      // Update fighter salary based on odds
      const { error: salaryErr } = await supabase.from("fighters").update({ salary }).eq("id", selectedFighter);
      if (salaryErr) throw salaryErr;

      const { error } = await supabase.from("event_fighters").insert({
        event_id: eventId!,
        fighter_id: selectedFighter,
        card_type: cardType,
        fight_order: fightOrder,
        odds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Lutador adicionado ao card!" });
      setSelectedFighter("");
      setOdds(0);
      queryClient.invalidateQueries({ queryKey: ["admin-event-fighters", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_fighters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Lutador removido do card" });
      queryClient.invalidateQueries({ queryKey: ["admin-event-fighters", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; fight_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("event_fighters").update({ fight_order: u.fight_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-event-fighters", eventId] });
    },
    onError: (err: any) => toast({ title: "Erro ao reordenar", description: err.message, variant: "destructive" }),
  });

  const recalcAllMutation = useMutation({
    mutationFn: async () => {
      for (const ef of eventFighters) {
        const salary = oddsToSalary((ef as any).odds ?? 0);
        await supabase.from("fighters").update({ salary }).eq("id", ef.fighter_id);
      }
    },
    onSuccess: () => {
      toast({ title: "Salários recalculados com base nas odds!" });
      queryClient.invalidateQueries({ queryKey: ["admin-event-fighters", eventId] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-fighters"] });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const cardType = result.source.droppableId;
    const group = eventFighters.filter((ef: any) => ef.card_type === cardType);
    const reordered = Array.from(group);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updates = reordered.map((ef: any, i: number) => ({ id: ef.id, fight_order: i + 1 }));
    // Optimistic update
    queryClient.setQueryData(["admin-event-fighters", eventId], (old: any[]) => {
      if (!old) return old;
      const otherGroup = old.filter((ef: any) => ef.card_type !== cardType);
      const updated = reordered.map((ef: any, i: number) => ({ ...ef, fight_order: i + 1 }));
      return [...otherGroup, ...updated].sort((a: any, b: any) => {
        if (a.card_type !== b.card_type) return a.card_type === "main" ? -1 : 1;
        return a.fight_order - b.fight_order;
      });
    });
    reorderMutation.mutate(updates);
  };

  const calculatedSalary = oddsToSalary(odds);

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Card — {event?.name ?? "..."}
          </h1>
          <p className="text-sm text-muted-foreground">{event?.date} · {event?.location}</p>
        </div>

        {/* Add fighter to card */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Adicionar Lutador ao Card</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display">Lutador</label>
              <select
                className="h-10 rounded-lg border border-[hsl(var(--input-border))] bg-input-surface px-3 text-sm text-foreground outline-none"
                value={selectedFighter}
                onChange={(e) => setSelectedFighter(e.target.value)}
              >
                <option value="">Selecione...</option>
                {availableFighters.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.weight_class})</option>
                ))}
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
            <div className="space-y-1.5">
              <OSSInput
                label="Odds (Americanas)"
                type="number"
                placeholder="-150 ou +200"
                value={String(odds)}
                onChange={(e) => setOdds(parseInt(e.target.value) || 0)}
                helperText={`Salário calculado: $${calculatedSalary.toLocaleString()}`}
              />
            </div>
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !selectedFighter}>
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </Button>
        </div>

        {/* Recalc button */}
        <Button variant="outline" onClick={() => recalcAllMutation.mutate()} disabled={recalcAllMutation.isPending}>
          <Calculator className="h-4 w-4 mr-2" />
          Recalcular Todos os Salários pelas Odds
        </Button>

        {/* Card list with drag and drop */}
        {loadingEF ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-3">
              {["main", "prelim"].map((type) => {
                const group = eventFighters.filter((ef: any) => ef.card_type === type);
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
                          {group.map((ef: any, index: number) => (
                            <Draggable key={ef.id} draggableId={ef.id} index={index}>
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
                                    <span className="font-mono text-xs text-muted-foreground w-6 text-center">{ef.fight_order}</span>
                                    <span className="text-lg">{(ef.fighters as any)?.country}</span>
                                    <div>
                                      <span className="font-display font-bold uppercase">{(ef.fighters as any)?.name}</span>
                                      <p className="text-xs text-muted-foreground">
                                        {(ef.fighters as any)?.weight_class} · Odds: {formatOdds(ef.odds ?? 0)} · Salary: ${((ef.fighters as any)?.salary ?? 0).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMutation.mutate(ef.id)}>
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

export default AdminEventCard;
