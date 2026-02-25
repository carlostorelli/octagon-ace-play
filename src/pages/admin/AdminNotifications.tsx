import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Trash2, Loader2, Users, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

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

        {/* Settings */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Notificações Automáticas
            </CardTitle>
            <CardDescription>Configure quais notificações são enviadas automaticamente.</CardDescription>
          </CardHeader>
          <CardContent>
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
                {recentNotifications.map((n: any) => (
                  <div key={n.id} className="flex items-start justify-between rounded-lg border border-border/30 p-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{n.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                          n.type === "welcome" ? "bg-accent/10 text-accent" :
                          n.type === "admin_broadcast" ? "bg-primary/10 text-primary" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {n.type === "welcome" ? "boas-vindas" : n.type === "admin_broadcast" ? "broadcast" : n.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotif.mutate(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminNotifications;
