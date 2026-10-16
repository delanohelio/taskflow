import { X, Share, PlusSquare, Smartphone, Download, CheckCircle2 } from "lucide-react";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onDirectInstall?: () => void;
  hasDirectPrompt?: boolean;
}

export default function InstallAppModal({
  isOpen,
  onClose,
  isIOS,
  onDirectInstall,
  hasDirectPrompt,
}: InstallAppModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content w-full max-w-md overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-2xl">
        {/* Header with App Brand */}
        <div className="relative bg-gradient-to-br from-brand-600 via-indigo-700 to-brand-900 p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* App Icon preview */}
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden p-1 border-2 border-white/20">
            <img src="/pwa-192x192.png" alt="TaskFlow Icon" className="h-full w-full rounded-xl object-contain" />
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">Instalar o TaskFlow</h3>
          <p className="mt-1 text-xs text-brand-100/90 max-w-xs mx-auto">
            Acesse rapidamente como um aplicativo nativo na tela inicial do seu celular ou computador.
          </p>
        </div>

        {/* Instructions Body */}
        <div className="p-6 space-y-4">
          {hasDirectPrompt ? (
            <div className="text-center space-y-4 py-2">
              <p className="text-sm text-surface-600">
                Seu navegador suporta a instalação direta em um clique.
              </p>
              <button
                onClick={() => {
                  if (onDirectInstall) onDirectInstall();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-md hover:from-brand-700 hover:to-indigo-700 active:scale-98 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Instalar Agora
              </button>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400">
                <Smartphone className="h-4 w-4 text-brand-600" />
                Passo a passo no iPhone / iPad (Safari):
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 rounded-2xl bg-surface-50 p-3 border border-surface-200/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                    <Share className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-surface-800 block">1. Botão Compartilhar</span>
                    <span className="text-surface-500">
                      No Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima na barra inferior).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-surface-50 p-3 border border-surface-200/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                    <PlusSquare className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-surface-800 block">2. Adicionar à Tela de Início</span>
                    <span className="text-surface-500">
                      Role as ações para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-surface-50 p-3 border border-surface-200/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-surface-800 block">3. Confirmar Adição</span>
                    <span className="text-surface-500">
                      Toque em <strong>"Adicionar"</strong> no canto superior direito para concluir.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400">
                <Smartphone className="h-4 w-4 text-brand-600" />
                Como instalar no Android / Navegador:
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 rounded-2xl bg-surface-50 p-3 border border-surface-200/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-100 text-brand-700 shrink-0 mt-0.5">
                    <span className="font-extrabold text-xs">⋮</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-surface-800 block">1. Menu do Navegador</span>
                    <span className="text-surface-500">
                      Toque nos <strong>três pontinhos</strong> no canto superior direito do Chrome ou navegador.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-surface-50 p-3 border border-surface-200/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-surface-800 block">2. Instalar Aplicativo</span>
                    <span className="text-surface-500">
                      Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-surface-200 bg-surface-100 py-2.5 text-xs font-bold text-surface-700 hover:bg-surface-200 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
