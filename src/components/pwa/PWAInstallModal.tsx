import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share, PlusSquare, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

const PWAInstallModal = () => {
  const { showIosModal, setShowIosModal, settings, platform } = usePWA();

  return (
    <Dialog open={showIosModal} onOpenChange={setShowIosModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display uppercase tracking-wider">
            <Smartphone className="h-5 w-5 text-primary" />
            {settings.install_modal_title}
          </DialogTitle>
          <DialogDescription>{settings.install_modal_description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium flex items-center gap-2">
                Toque em <Share className="h-4 w-4 text-primary" /> Compartilhar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {platform === "ios"
                  ? "Use o ícone de compartilhamento no rodapé do Safari."
                  : "Use o menu do navegador (três pontinhos)."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium flex items-center gap-2">
                Selecione <PlusSquare className="h-4 w-4 text-primary" /> Adicionar à Tela de Início
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Role um pouco a lista se não encontrar de imediato.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              ✓
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Pronto!</p>
              <p className="text-xs text-muted-foreground mt-1">
                O app aparecerá como ícone na sua tela inicial e abrirá em tela cheia.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ No iPhone, a instalação só funciona pelo Safari (não funciona no Chrome ou Firefox iOS).
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallModal;
