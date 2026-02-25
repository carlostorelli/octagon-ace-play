import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Shield, ShieldOff, Loader2, Bell, UserPlus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
  roles: string[];
}

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const res = await supabase.functions.invoke("admin-users", {
        method: "GET",
        headers,
      });
      if (res.error) throw res.error;
      return res.data as AdminUser[];
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAuthHeader();
      const res = await supabase.functions.invoke("admin-users?action=toggle-admin", {
        method: "POST",
        body: { user_id: userId },
        headers,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: data.action === "added" ? "Admin adicionado" : "Admin removido",
      });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeader();
      const res = await supabase.functions.invoke("admin-users?action=create-user", {
        method: "POST",
        body: { email: newEmail, password: newPassword, display_name: newName },
        headers,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Usuário criado com sucesso!" });
      setAddDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const filtered = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Usuários</h1>
            <p className="text-sm text-muted-foreground">Gerencie os usuários da plataforma</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button size="sm" className="gap-2" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4" /> Adicionar Usuário
            </Button>
            <OSSInput
              variant="search"
              inputSize="sm"
              placeholder="Buscar usuários..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56"
            />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">
              Lista de Usuários ({filtered.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((user) => {
                const isAdmin = user.roles.includes("admin");
                return (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-background/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {user.display_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">
                            {user.display_name}
                          </span>
                          {isAdmin && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              <Shield className="h-3 w-3 mr-1" /> Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          ID: {user.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Desde {new Date(user.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={isAdmin ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleAdmin.mutate(user.id)}
                        disabled={toggleAdmin.isPending}
                      >
                        {isAdmin ? (
                          <><ShieldOff className="h-3.5 w-3.5 mr-1" /> Remover Admin</>
                        ) : (
                          <><Shield className="h-3.5 w-3.5 mr-1" /> Tornar Admin</>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">Adicionar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do usuário" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Senha inicial" />
            </div>
            <Button
              className="w-full"
              onClick={() => createUser.mutate()}
              disabled={createUser.isPending || !newEmail || !newPassword}
            >
              {createUser.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
