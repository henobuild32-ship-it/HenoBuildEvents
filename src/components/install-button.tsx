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

  // Don't show the install button if already installed as PWA
  if (isInstalled) {
    return null;
  }

  // On Android: show only if installable (beforeinstallprompt fired)
  // On iOS: always show (no beforeinstallprompt support)
  // On Desktop: show only if installable
  if (platform !== "ios" && !isInstallable) {
    return null;
  }

  const handleClick = async () => {
    if (platform === "ios") {
      setShowIOSDialog(true);
      return;
    }

    await install();
  };

  const getButtonLabel = () => {
    if (platform === "android") return "Télécharger sur Android";
    if (platform === "ios") return "Télécharger sur iPhone";
    return "Installer l'application";
  };

  const getButtonIcon = () => {
    if (platform === "android") return <Smartphone className="size-5" />;
    if (platform === "ios") return <Apple className="size-5" />;
    return <Download className="size-5" />;
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isInstalling}
        className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #d4a853 0%, #b8860b 50%, #d4a853 100%)",
          backgroundSize: "200% 200%",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      >
        {/* Shimmer animation overlay */}
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            animation: "shimmer-hover 1.5s ease-in-out infinite",
          }}
        />

        {/* Glow effect */}
        <span className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" style={{ background: "linear-gradient(135deg, #d4a853, #b8860b)" }} />

        <span className="relative flex items-center gap-2.5">
          {isInstalling ? (
            <svg
              className="size-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            getButtonIcon()
          )}
          <span>{isInstalling ? "Installation..." : getButtonLabel()}</span>
        </span>
      </button>

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

      {/* Global keyframe styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer-hover {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}
