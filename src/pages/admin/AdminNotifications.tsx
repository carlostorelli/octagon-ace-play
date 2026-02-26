import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Trash2, Loader2, Users, UserPlus, Megaphone, Save, Plus, Pencil, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);

  // Welcome message dialog state
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [editingWelcome, setEditingWelcome] = useState<{ id: string; title: string; message: string } | null>(null);
  const [welcomeFormTitle, setWelcomeFormTitle] = useState("");
  const [welcomeFormMessage, setWelcomeFormMessage] = useState("");

  // Fetch announcement from site_settings
  const { data: announcementSettings } = useQuery({
    queryKey: ["announcement-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["announcement_title", "announcement_message", "announcement_active"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (announcementSettings) {
      const t = announcementSettings.find((s: any) => s.key === "announcement_title");
      const m = announcementSettings.find((s: any) => s.key === "announcement_message");
      const a = announcementSettings.find((s: any) => s.key === "announcement_active");
      if (t) setAnnouncementTitle(t.value);
      if (m) setAnnouncementMessage(m.value);
      if (a) setAnnouncementActive(a.value === "true");
    }
  }, [announcementSettings]);

  const saveAnnouncement = useMutation({
    mutationFn: async () => {
      const upsertRow = async (key: string, value: string) => {
        const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
        if (existing) {
          await supabase.from("site_settings").update({ value }).eq("key", key);
        } else {
          await supabase.from("site_settings").insert({ key, value });
        }
      };
      await upsertRow("announcement_title", announcementTitle);
      await upsertRow("announcement_message", announcementMessage);
      await upsertRow("announcement_active", String(announcementActive));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-settings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-announcement"] });
      toast({ title: "Comunicado salvo", description: announcementActive ? "O comunicado está ativo no dashboard." : "O comunicado está inativo." });
    },
    onError: () => {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    },
  });

  // Welcome messages CRUD
  const { data: welcomeMessages = [] } = useQuery({
    queryKey: ["welcome-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("welcome_messages").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveWelcomeMsg = useMutation({
    mutationFn: async ({ id, title, message }: { id?: string; title: string; message: string }) => {
      if (id) {
        const { error } = await supabase.from("welcome_messages").update({ title, message }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("welcome_messages").insert({ title, message });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcome-messages"] });
      setWelcomeDialogOpen(false);
      setEditingWelcome(null);
      toast({ title: editingWelcome ? "Mensagem atualizada" : "Mensagem criada" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    },
  });

  const deleteWelcomeMsg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("welcome_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcome-messages"] });
      toast({ title: "Mensagem excluída" });
    },
  });

  const openNewWelcome = () => {
    setEditingWelcome(null);
    setWelcomeFormTitle("");
    setWelcomeFormMessage("");
    setWelcomeDialogOpen(true);
  };

  const openEditWelcome = (msg: any) => {
    setEditingWelcome(msg);
    setWelcomeFormTitle(msg.title);
    setWelcomeFormMessage(msg.message);
    setWelcomeDialogOpen(true);
  };

  // Fetch all profiles for broadcast
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-notif"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, display_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch recent notifications (admin can see all)
  const { data: recentNotifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch notification settings
  const { data: settings = [] } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notification_settings").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const notifyNewUser = settings.find((s: any) => s.key === "notify_new_user");

  // Toggle setting
  const toggleSetting = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("notification_settings").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast({ title: "Configuração atualizada" });
    },
  });

  // Send notification to all users
  const sendBroadcast = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !message.trim()) throw new Error("Preencha título e mensagem");
      const rows = profiles.map((p: any) => ({
        user_id: p.user_id,
        title: title.trim(),
        message: message.trim(),
        type: "admin_broadcast",
      }));
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      setTitle("");
      setMessage("");
      toast({ title: "Notificação enviada", description: `Enviada para ${profiles.length} usuários.` });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  // Delete notification
  const deleteNotif = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Notificações</h1>

        {/* Comunicado no Dashboard */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Megaphone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Comunicado no Dashboard</CardTitle>
                  <CardDescription>Mensagem que aparecerá para todos os usuários no painel</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{announcementActive ? "Ativo" : "Inativo"}</span>
                <Switch checked={announcementActive} onCheckedChange={setAnnouncementActive} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título do Comunicado</Label>
              <Input placeholder="Ex: Novidades da temporada!" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem</Label>
              <Textarea placeholder="Escreva o comunicado que aparecerá no dashboard..." value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} rows={4} />
            </div>
            <Button onClick={() => saveAnnouncement.mutate()} disabled={saveAnnouncement.isPending} className="w-full gap-1.5">
              {saveAnnouncement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Notificações Automáticas
            </CardTitle>
            <CardDescription>Configure quais notificações são enviadas automaticamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/30 p-4">
              <div>
                <p className="font-medium text-sm">Novos Usuários</p>
                <p className="text-xs text-muted-foreground">Envia mensagem de boas-vindas quando um novo usuário se cadastra</p>
              </div>
              <Switch
                checked={notifyNewUser?.enabled ?? true}
                onCheckedChange={(checked) => {
                  if (notifyNewUser) toggleSetting.mutate({ id: notifyNewUser.id, enabled: checked });
                }}
              />
            </div>
            {(notifyNewUser?.enabled ?? true) && (
              <div className="space-y-3 rounded-lg border border-border/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Mensagens de Boas-Vindas ({welcomeMessages.length})</p>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={openNewWelcome}>
                    <Plus className="h-3.5 w-3.5" /> Nova Mensagem
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Uma mensagem aleatória será enviada para cada novo usuário.</p>
                {welcomeMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem cadastrada.</p>
                ) : (
                  <div className="space-y-2">
                    {welcomeMessages.map((wm: any) => (
                      <div key={wm.id} className="flex items-start justify-between rounded-lg border border-border/30 p-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{wm.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{wm.message}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditWelcome(wm)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteWelcomeMsg.mutate(wm.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send Broadcast */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-primary" />
              Enviar Notificação
            </CardTitle>
            <CardDescription>Envie uma notificação para todos os {profiles.length} usuários cadastrados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Ex: Novo evento disponível!" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem</Label>
              <Textarea placeholder="Escreva a mensagem da notificação..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>
            <Button onClick={() => sendBroadcast.mutate()} disabled={sendBroadcast.isPending || !title.trim() || !message.trim()} className="gap-1.5">
              {sendBroadcast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar para todos
            </Button>
          </CardContent>
        </Card>

        {/* Recent notifications */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notificações Recentes
            </CardTitle>
            <CardDescription>Últimas 50 notificações enviadas no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação enviada ainda.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(() => {
                  // Group broadcast/welcome by title+message+type, keep individual ones as-is
                  const grouped: { key: string; sample: any; count: number; ids: string[] }[] = [];
                  const seen = new Map<string, number>();
                  for (const n of recentNotifications) {
                    if (n.type === "admin_broadcast" || n.type === "welcome") {
                      const key = `${n.type}||${n.title}||${n.message}`;
                      if (seen.has(key)) {
                        const idx = seen.get(key)!;
                        grouped[idx].count++;
                        grouped[idx].ids.push(n.id);
                      } else {
                        seen.set(key, grouped.length);
                        grouped.push({ key, sample: n, count: 1, ids: [n.id] });
                      }
                    } else {
                      grouped.push({ key: n.id, sample: n, count: 1, ids: [n.id] });
                    }
                  }
                  return grouped.map((g) => (
                    <div key={g.key} className="flex items-start justify-between rounded-lg border border-border/30 p-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{g.sample.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            g.sample.type === "welcome" ? "bg-accent/10 text-accent" :
                            g.sample.type === "admin_broadcast" ? "bg-primary/10 text-primary" :
                            "bg-secondary text-muted-foreground"
                          }`}>
                            {g.sample.type === "welcome" ? "boas-vindas" : g.sample.type === "admin_broadcast" ? "broadcast" : g.sample.type}
                          </span>
                          {g.count > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                              <Users className="inline h-3 w-3 mr-0.5" />{g.count} usuários
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.sample.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(g.sample.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                        g.ids.forEach((id) => deleteNotif.mutate(id));
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Welcome message dialog */}
      <Dialog open={welcomeDialogOpen} onOpenChange={setWelcomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWelcome ? "Editar Mensagem" : "Nova Mensagem de Boas-Vindas"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={welcomeFormTitle} onChange={(e) => setWelcomeFormTitle(e.target.value)} placeholder="Bem-vindo ao OSS Fantasy! 🎉" />
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem</Label>
              <Textarea value={welcomeFormMessage} onChange={(e) => setWelcomeFormMessage(e.target.value)} rows={3} placeholder="Sua conta foi criada com sucesso..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWelcomeDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => saveWelcomeMsg.mutate({ id: editingWelcome?.id, title: welcomeFormTitle.trim(), message: welcomeFormMessage.trim() })}
              disabled={saveWelcomeMsg.isPending || !welcomeFormTitle.trim() || !welcomeFormMessage.trim()}
              className="gap-1.5"
            >
              {saveWelcomeMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNotifications;
