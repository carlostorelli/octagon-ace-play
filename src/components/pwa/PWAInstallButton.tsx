import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "@/hooks/use-toast";

interface Props {
  variant?: "icon" | "default" | "card";
  className?: string;
}

const PWAInstallButton = ({ variant = "default", className }: Props) => {
  const { installed, canPromptInstall, promptInstall, platform } = usePWA();

  if (installed) {
    if (variant === "icon") return null;
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Check className="h-4 w-4 mr-1.5" /> App instalado
      </Button>
    );
  }

  // PWA install só em mobile (Android/iOS). No desktop, esconde sempre.
  if (platform !== "ios" && platform !== "android") return null;

  const handle = async () => {
    const r = await promptInstall();
    if (r === "unavailable" && platform !== "ios") {
      toast({
        title: "Instalação ainda não disponível",
        description:
          "Use o menu do seu navegador (Adicionar à tela inicial) ou aguarde o prompt nativo aparecer.",
      });
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handle}
        title="Instalar app"
        aria-label="Instalar app"
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${className || ""}`}
      >
        <Download className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button onClick={handle} className={className} size={variant === "card" ? "lg" : "sm"}>
      <Download className="h-4 w-4 mr-1.5" />
      {platform === "ios" ? "Adicionar à Tela Inicial" : "Instalar no celular"}
    </Button>
  );
};

export default PWAInstallButton;
