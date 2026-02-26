import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Mail, Eye, EyeOff, Save, CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [whatsappLink, setWhatsappLink] = useState("");

  const { data: settings, isLoading } = useQuery({
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

        <div className="space-y-6">
          {/* WhatsApp Group */}
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
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminSettings;
