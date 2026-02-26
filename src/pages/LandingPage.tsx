import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import heroImage from "@/assets/hero-octagon.jpg";

const LandingPage = () => {
  const { data: regulamento, isLoading: loadingReg } = useQuery({
    queryKey: ["site-settings", "regulamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "regulamento")
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? "";
    },
  });

  // Simple markdown-like rendering (headings, lists, paragraphs)
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith("# "))
        return <h2 key={i} className="font-display text-2xl font-bold uppercase tracking-tight mb-3 mt-6">{trimmed.slice(2)}</h2>;
      if (trimmed.startsWith("## "))
        return <h3 key={i} className="font-display text-xl font-bold uppercase tracking-tight mb-2 mt-4">{trimmed.slice(3)}</h3>;
      if (/^\d+\.\s/.test(trimmed))
        return <li key={i} className="ml-6 list-decimal text-sm text-muted-foreground mb-1">{trimmed.replace(/^\d+\.\s/, "")}</li>;
      if (trimmed.startsWith("- "))
        return <li key={i} className="ml-6 list-disc text-sm text-muted-foreground mb-1">{trimmed.slice(2)}</li>;
      return <p key={i} className="text-sm text-muted-foreground mb-1">{trimmed}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/60 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-wider uppercase">
              OSS<span className="text-primary"> Fantasy</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

        <div className="container relative z-10 py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-mono font-medium text-primary uppercase tracking-widest">
              &gt; OSS Fantasy — Palpites de MMA
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-bold uppercase leading-[0.95] tracking-tight mb-6">
              Faça seus palpites.{" "}
              <span className="text-gradient">Domine o Octógono.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Escolha o vencedor, método e round de cada luta — acumule pontos e concorra a brindes no sorteio! Sem apostas, só diversão.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-8 glow">
                  Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-display uppercase tracking-wider text-base px-8">
                  Ver Ranking
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Regulamento */}
      <section className="py-16 border-t border-border">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight">Regulamento</h2>
            </div>
            <div className="glass-card rounded-xl p-8">
              {loadingReg ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : regulamento ? (
                <div>{renderMarkdown(regulamento)}</div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum regulamento cadastrado.</p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-display uppercase tracking-wider">OSS<span className="text-primary"> Fantasy</span></span>
          </div>
          <p>© 2026 OSS Fantasy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
