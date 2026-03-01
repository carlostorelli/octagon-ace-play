import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, Shield, ShieldOff, Loader2, UserPlus, MoreHorizontal,
  Trash2, Ban, Unlock, KeyRound, Pencil, Mail, BadgeCheck,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OSSInput } from "@/components/ui/oss-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
  instagram: string;
  verified: boolean;
  roles: string[];
  banned: boolean;
}

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const invokeAction = async (action: string, body: Record<string, any>) => {
    const headers = await getAuthHeader();
    const res = await supabase.functions.invoke(`admin-users?action=${action}`, {
      method: "POST",
      body,
      headers,
    });
    if (res.error) throw res.error;
    return res.data;
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
    mutationFn: (userId: string) => invokeAction("toggle-admin", { user_id: userId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: data.action === "added" ? "Admin adicionado" : "Admin removido" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const createUser = useMutation({
    mutationFn: () => invokeAction("create-user", { email: newEmail, password: newPassword, display_name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Usuário criado com sucesso!" });
      setAddDialogOpen(false);
      setNewEmail(""); setNewPassword(""); setNewName("");
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => invokeAction("delete-user", { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Usuário excluído" });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const banUser = useMutation({
    mutationFn: (userId: string) => invokeAction("ban-user", { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Usuário bloqueado" });
      setBanDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const unbanUser = useMutation({
    mutationFn: (userId: string) => invokeAction("unban-user", { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Usuário desbloqueado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const resetPassword = useMutation({
    mutationFn: (userId: string) => invokeAction("reset-password", { user_id: userId }),
    onSuccess: (data) => {
      toast({ title: "Link de recuperação enviado", description: `Email enviado para ${data.email}` });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateUser = useMutation({
    mutationFn: () => invokeAction("update-user", {
      user_id: selectedUser?.id,
      display_name: editName,
      email: editEmail !== selectedUser?.email ? editEmail : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Usuário atualizado" });
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleVerified = useMutation({
    mutationFn: (userId: string) => invokeAction("toggle-verified", { user_id: userId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: data.verified ? "Selo verificado adicionado" : "Selo verificado removido" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditName(user.display_name);
    setEditEmail(user.email);
    setEditDialogOpen(true);
  };

  const openDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const openBan = (user: AdminUser) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

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
              <UserPlus className="h-4 w-4" /> Adicionar
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
                          {user.verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-400 shrink-0" />
                          )}
                          {isAdmin && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              <Shield className="h-3 w-3 mr-1" /> Admin
                            </Badge>
                          )}
                          {user.banned && (
                            <Badge variant="destructive" className="text-xs">
                              <Ban className="h-3 w-3 mr-1" /> Bloqueado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Desde {new Date(user.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAdmin.mutate(user.id)}>
                            {isAdmin ? (
                              <><ShieldOff className="h-4 w-4 mr-2" /> Remover Admin</>
                            ) : (
                              <><Shield className="h-4 w-4 mr-2" /> Tornar Admin</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => resetPassword.mutate(user.id)}>
                            <KeyRound className="h-4 w-4 mr-2" /> Recuperar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleVerified.mutate(user.id)}>
                            <BadgeCheck className="h-4 w-4 mr-2" />
                            {user.verified ? "Remover Verificado" : "Marcar Verificado"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.banned ? (
                            <DropdownMenuItem onClick={() => unbanUser.mutate(user.id)}>
                              <Unlock className="h-4 w-4 mr-2" /> Desbloquear
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openBan(user)}
                            >
                              <Ban className="h-4 w-4 mr-2" /> Bloquear
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDelete(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">Editar Usuário</DialogTitle>
            <DialogDescription>Altere as informações do usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <Button
              className="w-full"
              onClick={() => updateUser.mutate()}
              disabled={updateUser.isPending || !editName}
            >
              {updateUser.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O usuário <strong>{selectedUser?.display_name}</strong> ({selectedUser?.email}) será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedUser && deleteUser.mutate(selectedUser.id)}
            >
              {deleteUser.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Confirmation */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{selectedUser?.display_name}</strong> não poderá mais acessar a plataforma até ser desbloqueado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedUser && banUser.mutate(selectedUser.id)}
            >
              {banUser.isPending ? "Bloqueando..." : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
