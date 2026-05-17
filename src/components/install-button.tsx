"use client";

import { useState } from "react";
import { Smartphone, Download, Apple } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function InstallButton() {
  const { isInstallable, isInstalled, platform, isInstalling, install, iosInstallInstructions } =
    usePWAInstall();
  const [showIOSDialog, setShowIOSDialog] = useState(false);
  const [showAndroidDialog, setShowAndroidDialog] = useState(false);

  // Don't show the install button if already installed as PWA
  if (isInstalled) {
    return null;
  }

  const handleAndroidClick = async () => {
    // If on Android and installable, trigger native prompt
    if (platform === "android" && isInstallable) {
      await install();
      return;
    }
    // Otherwise show instructions dialog
    setShowAndroidDialog(true);
  };

  const handleIOSClick = () => {
    // If on iOS, show the instructions dialog
    setShowIOSDialog(true);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Android Button - Always Visible */}
        <button
          onClick={handleAndroidClick}
          disabled={isInstalling && platform === "android"}
          className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed border-2 border-white/10"
          style={{
            background: "linear-gradient(135deg, #3ddc84 0%, #00a956 50%, #3ddc84 100%)",
            backgroundSize: "200% 200%",
          }}
        >
          <span className="relative flex items-center gap-2.5">
            {isInstalling && platform === "android" ? (
              <svg className="size-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Smartphone className="size-5" />
            )}
            <span className="text-sm font-bold">{isInstalling && platform === "android" ? "Installation..." : "Télécharger sur Android"}</span>
          </span>
        </button>

        {/* iOS Button - Always Visible */}
        <button
          onClick={handleIOSClick}
          className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] border-2 border-white/10"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            backgroundSize: "200% 200%",
          }}
        >
          <span className="relative flex items-center gap-2.5">
            <Apple className="size-5" />
            <span className="text-sm font-bold">Télécharger sur iPhone</span>
          </span>
        </button>
      </div>

      {/* Android Install Instructions Dialog */}
      <Dialog open={showAndroidDialog} onOpenChange={setShowAndroidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Smartphone className="size-6" style={{ color: "#3ddc84" }} />
              Installer sur Android
            </DialogTitle>
            <DialogDescription>
              Suivez ces étapes pour ajouter HenoBuild à votre écran d&apos;accueil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {[
              "Ouvrez cette page dans Chrome ou Edge sur votre Android",
              "Appuyez sur les trois points ⋮ en haut à droite du navigateur",
              "Sélectionnez « Installer l'application » ou « Ajouter à l'écran d'accueil »",
              "Confirmez en appuyant sur « Installer »",
              "L'application HenoBuild est maintenant sur votre écran d'accueil !",
            ].map((instruction, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #3ddc84, #00a956)" }}
                >
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 pt-1">
                  {instruction}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowAndroidDialog(false)}
              className="rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #3ddc84, #00a956)" }}
            >
              Compris !
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* iOS Install Instructions Dialog */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Apple className="size-6" style={{ color: "#d4a853" }} />
              Installer sur iPhone
            </DialogTitle>
            <DialogDescription>
              Suivez ces étapes pour ajouter HenoBuild à votre écran d&apos;accueil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {iosInstallInstructions.map((instruction, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #d4a853, #b8860b)" }}
                >
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 pt-1">
                  {instruction.replace(/^\d+\.\s*/, "")}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowIOSDialog(false)}
              className="rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #d4a853, #b8860b)" }}
            >
              Compris !
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
