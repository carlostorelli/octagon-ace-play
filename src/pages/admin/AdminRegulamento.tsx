import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, FileText, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminRegulamento = () => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings", "regulamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "regulamento")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data?.value) setContent(data.value);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: content, updated_at: new Date().toISOString() })
        .eq("key", "regulamento");
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Regulamento salvo!" });
      queryClient.invalidateQueries({ queryKey: ["site-settings", "regulamento"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Regulamento</h1>
            <p className="text-sm text-muted-foreground">Edite o regulamento exibido na página inicial. Suporta Markdown.</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="# Regulamento..."
            />
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminRegulamento;
