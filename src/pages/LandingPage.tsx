import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/data/mockData";

import heroImage from "@/assets/hero-octagon.jpg";

const LandingPage = () => {
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
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

        <div className="container relative z-10 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-mono font-medium text-primary uppercase tracking-widest">
              &gt; OSS Fantasy — O Fantasy Game de MMA
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-bold uppercase leading-[0.95] tracking-tight mb-6">
              Monte seu time.{" "}
              <span className="text-gradient">Domine o Octógono.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Escale lutadores, acumule pontos a cada KO, finalização e performance da noite — e concorra a brindes no sorteio! Sem apostas, só diversão.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-8 glow">
                  Jogar Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/events">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-display uppercase tracking-wider text-base px-8">
                  Ver Eventos
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
              <h2 className="font-display text-4xl font-bold uppercase tracking-tight mb-4">
                Tudo que você precisa para <span className="text-gradient">se divertir</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Fantasy MMA entre amigos — pontuação em tempo real e sorteio de brindes
              </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="container">
          <div className="glass-card rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold uppercase tracking-tight mb-4">
                Pronto para entrar no <span className="text-gradient">Octógono</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Cadastre-se gratuitamente e comece a escalar seu time para o próximo evento UFC.
              </p>
              <Link to="/dashboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider text-base px-10 glow">
                  Criar Conta Grátis <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
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
