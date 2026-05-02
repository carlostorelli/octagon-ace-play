import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---------- Types ----------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface PWASettings {
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  icon_url: string;
  apple_touch_icon_url: string;
  splash_image_url: string;
  install_banner_title: string;
  install_banner_subtitle: string;
  install_modal_title: string;
  install_modal_description: string;
}

const DEFAULT_PWA: PWASettings = {
  name: "OSS Fantasy - Palpites de MMA",
  short_name: "OSS Fantasy",
  description: "Faça seus palpites de MMA e domine o octógono!",
  theme_color: "#000000",
  background_color: "#0a0a0a",
  icon_url: "",
  apple_touch_icon_url: "",
  splash_image_url: "",
  install_banner_title: "Instale o OSS Fantasy",
  install_banner_subtitle: "Acesso rápido, notificações e experiência completa direto da sua tela inicial.",
  install_modal_title: "Instalar no iPhone",
  install_modal_description: 'Toque no botão Compartilhar e depois em "Adicionar à Tela de Início".',
};

const PWA_KEYS = [
  "pwa_name",
  "pwa_short_name",
  "pwa_description",
  "pwa_theme_color",
  "pwa_background_color",
  "pwa_icon_url",
  "pwa_apple_touch_icon_url",
  "pwa_splash_image_url",
  "pwa_install_banner_title",
  "pwa_install_banner_subtitle",
  "pwa_install_modal_title",
  "pwa_install_modal_description",
];

// ---------- Environment helpers ----------

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isPreviewHost(): boolean {
  const h = window.location.hostname;
  return h.includes("lovableproject.com") || h.includes("id-preview--") || h.includes("lovable.app") === false && h.includes("localhost");
}

// We only enable PWA registration / install detection on production-like contexts.
// Preview/iframe blocks: SW does not work properly inside iframes.
export function isPWASupported(): boolean {
  if (typeof window === "undefined") return false;
  if (isInIframe()) return false;
  if (!("serviceWorker" in navigator)) return false;
  return true;
}

export function detectPlatform(): "ios" | "android" | "desktop" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/Win|Mac|Linux/i.test(ua)) return "desktop";
  return "other";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS
  if ((window.navigator as any).standalone === true) return true;
  // Android / Desktop
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) return true;
  return false;
}

// ---------- Settings hook ----------

export function usePWASettings(): PWASettings {
  const { data } = useQuery({
    queryKey: ["pwa-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", PWA_KEYS);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return useMemo(() => {
    const map: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      if (row?.key && typeof row.value === "string") map[row.key] = row.value;
    });
    return {
      name: map.pwa_name || DEFAULT_PWA.name,
      short_name: map.pwa_short_name || DEFAULT_PWA.short_name,
      description: map.pwa_description || DEFAULT_PWA.description,
      theme_color: map.pwa_theme_color || DEFAULT_PWA.theme_color,
      background_color: map.pwa_background_color || DEFAULT_PWA.background_color,
      icon_url: map.pwa_icon_url || DEFAULT_PWA.icon_url,
      apple_touch_icon_url: map.pwa_apple_touch_icon_url || DEFAULT_PWA.apple_touch_icon_url,
      splash_image_url: map.pwa_splash_image_url || DEFAULT_PWA.splash_image_url,
      install_banner_title: map.pwa_install_banner_title || DEFAULT_PWA.install_banner_title,
      install_banner_subtitle: map.pwa_install_banner_subtitle || DEFAULT_PWA.install_banner_subtitle,
      install_modal_title: map.pwa_install_modal_title || DEFAULT_PWA.install_modal_title,
      install_modal_description: map.pwa_install_modal_description || DEFAULT_PWA.install_modal_description,
    };
  }, [data]);
}

// ---------- Manifest injection ----------

export function applyPWAMetaToHead(s: PWASettings) {
  if (typeof document === "undefined") return;

  // theme-color
  const ensureMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  ensureMeta("theme-color", s.theme_color);
  ensureMeta("description", s.description);
  ensureMeta("apple-mobile-web-app-capable", "yes");
  ensureMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
  ensureMeta("apple-mobile-web-app-title", s.short_name);
  ensureMeta("mobile-web-app-capable", "yes");

  // apple-touch-icon
  if (s.apple_touch_icon_url) {
    let link = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "apple-touch-icon";
      document.head.appendChild(link);
    }
    link.href = s.apple_touch_icon_url;
  }

  // Manifest (Blob URL — dynamic)
  const icons: any[] = [];
  if (s.icon_url) {
    icons.push(
      { src: s.icon_url, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: s.icon_url, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: s.icon_url, sizes: "512x512", type: "image/png", purpose: "maskable" },
    );
  }
  if (s.apple_touch_icon_url && s.apple_touch_icon_url !== s.icon_url) {
    icons.push({ src: s.apple_touch_icon_url, sizes: "180x180", type: "image/png", purpose: "any" });
  }

  const manifest = {
    name: s.name,
    short_name: s.short_name,
    description: s.description,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: s.background_color,
    theme_color: s.theme_color,
    icons,
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  const url = URL.createObjectURL(blob);

  let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
  // Revoga URL antiga
  const prev = manifestLink?.dataset.blobUrl;
  if (prev) URL.revokeObjectURL(prev);

  if (!manifestLink) {
    manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = url;
  manifestLink.dataset.blobUrl = url;
}

// ---------- Install context ----------

interface PWAContextValue {
  platform: "ios" | "android" | "desktop" | "other";
  installed: boolean;
  canPromptInstall: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  showIosModal: boolean;
  setShowIosModal: (v: boolean) => void;
  bannerDismissedUntil: number;
  dismissBannerFor24h: () => void;
  shouldShowBanner: boolean;
  settings: PWASettings;
}

const PWAContext = createContext<PWAContextValue | null>(null);

const DISMISS_KEY = "pwa_install_dismissed_until";

export function PWAProvider({ children }: { children: ReactNode }) {
  const settings = usePWASettings();
  const [platform] = useState(detectPlatform);
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [bannerDismissedUntil, setBannerDismissedUntil] = useState<number>(() => {
    const v = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Number.isFinite(v) ? v : 0;
  });

  // Apply manifest + meta tags whenever settings change
  useEffect(() => {
    applyPWAMetaToHead(settings);
  }, [settings]);

  // Register service worker (production only)
  useEffect(() => {
    if (!isPWASupported()) {
      // Limpa SW antigo se estiver em iframe/preview
      navigator.serviceWorker?.getRegistrations?.().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => {}));
      }).catch(() => {});
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent — PWA install funciona melhor com SW, mas não é fatal
    });
  }, []);

  // Capture beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    // Re-check standalone on visibility (user voltou de instalação)
    const visHandler = () => {
      if (isStandalone()) setInstalled(true);
    };
    document.addEventListener("visibilitychange", visHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (platform === "ios") {
      setShowIosModal(true);
      return "unavailable" as const;
    }
    if (!deferredPrompt) {
      // Some browsers (desktop Chrome especially) podem não ter disparado ainda
      return "unavailable" as const;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      return choice.outcome;
    } catch {
      return "unavailable" as const;
    }
  }, [deferredPrompt, platform]);

  const dismissBannerFor24h = useCallback(() => {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setBannerDismissedUntil(until);
  }, []);

  const canPromptInstall = platform === "ios" ? true : !!deferredPrompt;

  const shouldShowBanner = useMemo(() => {
    if (installed) return false;
    if (Date.now() < bannerDismissedUntil) return false;
    // Em iframe/preview: não mostra (SW não registra, install nunca dispara)
    if (!isPWASupported() && platform !== "ios") return false;
    if (platform === "ios") return true;
    return !!deferredPrompt;
  }, [installed, bannerDismissedUntil, deferredPrompt, platform]);

  const value: PWAContextValue = {
    platform,
    installed,
    canPromptInstall,
    promptInstall,
    showIosModal,
    setShowIosModal,
    bannerDismissedUntil,
    dismissBannerFor24h,
    shouldShowBanner,
    settings,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error("usePWA must be used inside PWAProvider");
  return ctx;
}
