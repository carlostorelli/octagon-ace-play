import { motion } from "framer-motion";
import { Smartphone, Sparkles, Zap, Wifi } from "lucide-react";
import PWAInstallButton from "./PWAInstallButton";
import { usePWA } from "@/hooks/usePWA";

const PWADashboardCard = () => {
  const { installed, settings, platform } = usePWA();

  // Só mostra se NÃO instalado
  if (installed) return null;
  // PWA install só faz sentido em mobile (Android/iOS). Esconde no desktop e outros.
  if (platform !== "ios" && platform !== "android") return null;
  // Em iframe (preview) não funciona — esconde
  if (typeof window !== "undefined") {
    try {
      if (window.self !== window.top) return null;
    } catch { return null; }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-6"
    >
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/40 text-primary-foreground shadow-lg shadow-primary/30">
          {settings.icon_url ? (
            <img src={settings.icon_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <Smartphone className="h-8 w-8" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-widest text-accent">App</span>
          </div>
          <h3 className="font-display text-xl font-bold uppercase tracking-tight leading-tight">
            {settings.install_banner_title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{settings.install_banner_subtitle}</p>

          <div className="flex flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" /> Acesso instantâneo
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Wifi className="h-3.5 w-3.5 text-primary" /> Sem barra do navegador
            </span>
          </div>
        </div>

        <PWAInstallButton variant="card" className="w-full sm:w-auto" />
      </div>
    </motion.div>
  );
};

export default PWADashboardCard;
