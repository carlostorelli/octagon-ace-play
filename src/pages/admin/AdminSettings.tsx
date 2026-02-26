import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Mail, Eye, EyeOff, Save, CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const queryClient = useQueryClient();

  // Resend / Email state
  const [resendApiKey, setResendApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [fromEmail, setFromEmail] = useState("noreply@seudominio.com");
  const [fromName, setFromName] = useState("MMA Fantasy");
  const [keySaved, setKeySaved] = useState(false);

  const [welcomeSubject, setWelcomeSubject] = useState("Bem-vindo ao MMA Fantasy! 🥊");
  const [welcomeBody, setWelcomeBody] = useState(
    `<h1>Bem-vindo ao MMA Fantasy!</h1>
<p>Obrigado por se cadastrar. Confirme seu email clicando no link abaixo:</p>
<p><a href="{{confirmation_url}}">Confirmar Email</a></p>
<p>Boas lutas!</p>`
  );

  const [resetSubject, setResetSubject] = useState("Redefinir sua senha - MMA Fantasy");
  const [resetBody, setResetBody] = useState(
    `<h1>Redefinição de Senha</h1>
<p>Você solicitou a redefinição da sua senha. Clique no link abaixo:</p>
<p><a href="{{reset_url}}">Redefinir Senha</a></p>
<p>Se não foi você, ignore este email.</p>`
  );

  const handleSaveKey = () => {
    if (!resendApiKey.trim()) {
      toast({ title: "Erro", description: "Insira a API Key do Resend.", variant: "destructive" });
      return;
    }
    localStorage.setItem("resend_api_key", resendApiKey);
    setKeySaved(true);
    toast({ title: "API Key salva", description: "A chave do Resend foi armazenada com sucesso." });
  };

  const handleSaveTemplates = () => {
    localStorage.setItem("email_config", JSON.stringify({ fromEmail, fromName, welcomeSubject, welcomeBody, resetSubject, resetBody }));
    toast({ title: "Templates salvos", description: "As configurações de email foram atualizadas." });
  };

  // WhatsApp state
  const [whatsappLink, setWhatsappLink] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["whatsapp_group_link"]);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setWhatsappLink(settings.find((s) => s.key === "whatsapp_group_link")?.value || "");
    }
  }, [settings]);

  const saveWhatsapp = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "whatsapp_group_link")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: whatsappLink })
          .eq("key", "whatsapp_group_link");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "whatsapp_group_link", value: whatsappLink });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-announcement"] });
      toast({ title: "Link do WhatsApp salvo!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-6">Configurações</h1>

        <Tabs defaultValue="whatsapp" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Key className="h-4 w-4 mr-1.5" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Mail className="h-4 w-4 mr-1.5" />
              Templates de Email
            </TabsTrigger>
          </TabsList>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp">
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Grupo do WhatsApp
                </CardTitle>
                <CardDescription>
                  Cole o link do grupo do WhatsApp. Os usuários verão um botão no Dashboard para entrar no grupo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Link do grupo</Label>
                  <Input
                    placeholder="https://chat.whatsapp.com/..."
                    value={whatsappLink}
                    onChange={(e) => setWhatsappLink(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => saveWhatsapp.mutate()}
                  disabled={saveWhatsapp.isPending}
                  className="gap-1.5"
                >
                  {saveWhatsapp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api">
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="h-5 w-5 text-primary" />
                  Resend API Key
                </CardTitle>
                <CardDescription>
                  Configure sua chave de API do Resend para envio de emails personalizados.
                  Crie uma conta em{" "}
                  <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    resend.com
                  </a>{" "}
                  e gere sua API key em{" "}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    resend.com/api-keys
                  </a>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resend-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="resend-key"
                        type={showKey ? "text" : "password"}
                        placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                        value={resendApiKey}
                        onChange={(e) => {
                          setResendApiKey(e.target.value);
                          setKeySaved(false);
                        }}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button onClick={handleSaveKey} className="gap-1.5">
                      {keySaved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {keySaved ? "Salvo" : "Salvar"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Não esqueça de verificar seu domínio em{" "}
                    <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      resend.com/domains
                    </a>.
                  </p>
                </div>

                <div className="border-t border-border/30 pt-4 space-y-3">
                  <h3 className="text-sm font-medium">Remetente</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="from-name">Nome</Label>
                      <Input
                        id="from-name"
                        placeholder="MMA Fantasy"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="from-email">Email</Label>
                      <Input
                        id="from-email"
                        type="email"
                        placeholder="noreply@seudominio.com"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="templates">
            <div className="space-y-6">
              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="text-lg">📧 Email de Boas-Vindas</CardTitle>
                  <CardDescription>
                    Enviado quando um novo usuário se cadastra. Use <code className="text-primary text-xs bg-secondary px-1 py-0.5 rounded">{"{{confirmation_url}}"}</code> para o link de confirmação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Assunto</Label>
                    <Input value={welcomeSubject} onChange={(e) => setWelcomeSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Corpo (HTML)</Label>
                    <Textarea value={welcomeBody} onChange={(e) => setWelcomeBody(e.target.value)} rows={8} className="font-mono text-xs" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="text-lg">🔑 Email de Recuperação de Senha</CardTitle>
                  <CardDescription>
                    Enviado quando o usuário solicita redefinir a senha. Use <code className="text-primary text-xs bg-secondary px-1 py-0.5 rounded">{"{{reset_url}}"}</code> para o link de reset.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Assunto</Label>
                    <Input value={resetSubject} onChange={(e) => setResetSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Corpo (HTML)</Label>
                    <Textarea value={resetBody} onChange={(e) => setResetBody(e.target.value)} rows={8} className="font-mono text-xs" />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveTemplates} className="gap-1.5">
                <Save className="h-4 w-4" />
                Salvar Templates
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminSettings;
