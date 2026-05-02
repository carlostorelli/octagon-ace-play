import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

const PWAInstallBanner = () => {
  const { shouldShowBanner, dismissBannerFor24h, promptInstall, settings, platform } = usePWA();

  return (
    <AnimatePresence>
      {shouldShowBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-[60]"
        >
          <div className="glass-card rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-md p-4 shadow-2xl shadow-primary/10">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {settings.icon_url ? (
                  <img src={settings.icon_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <Smartphone className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold uppercase tracking-wide text-sm leading-tight">
                  {settings.install_banner_title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  {settings.install_banner_subtitle}
                </p>
              </div>
              <button
                onClick={dismissBannerFor24h}
                aria-label="Fechar"
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 -mr-1 -mt-1 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button onClick={() => promptInstall()} size="sm" className="flex-1 gap-1.5">
                <Download className="h-4 w-4" />
                {platform === "ios" ? "Como instalar" : "Instalar"}
              </Button>
              <Button onClick={dismissBannerFor24h} size="sm" variant="ghost">
                Agora não
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
