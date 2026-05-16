"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "desktop";

interface PWAInstallState {
  /** Whether the app can be installed (beforeinstallprompt was fired) */
  isInstallable: boolean;
  /** Whether the app is currently running as an installed PWA */
  isInstalled: boolean;
  /** The detected platform */
  platform: Platform;
  /** Whether the install prompt is currently being shown */
  isInstalling: boolean;
}

interface PWAInstallActions {
  /** Trigger the native install prompt (Android/Desktop). Returns true if accepted. */
  install: () => Promise<boolean>;
  /** iOS-specific: instructions for adding to home screen */
  iosInstallInstructions: string[];
}

interface UsePWAInstallReturn extends PWAInstallState, PWAInstallActions {}

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";

  const userAgent = navigator.userAgent.toLowerCase();

  // Detect iOS (iPhone, iPad, iPod) - but NOT standalone mode
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  // Also detect iPad on iOS 13+ which reports as Mac
  const isIPadOnIOS13 =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (isIOS || isIPadOnIOS13) {
    return "ios";
  }

  // Detect Android
  if (/android/.test(userAgent)) {
    return "android";
  }

  return "desktop";
}

function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") return false;

  // Check if running in standalone mode
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone: boolean }).standalone === true;

  // Also check if launched from iOS home screen
  const isIOSStandalone = (navigator as unknown as { standalone: boolean }).standalone === true;

  return isStandalone || isIOSStandalone;
}

const IOS_INSTRUCTIONS = [
  "1. Appuyez sur l'icône de partage ⬆️ dans la barre de navigation Safari",
  "2. Faites défiler vers le bas et appuyez sur « Sur l'écran d'accueil »",
  "3. Appuyez sur « Ajouter » en haut à droite",
  "4. L'application HenoBuild est maintenant sur votre écran d'accueil !",
];

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Detect platform
    setPlatform(detectPlatform());

    // Check if already installed
    setIsInstalled(isRunningAsPWA());

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Also listen for display-mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      setIsInstalled(isRunningAsPWA());
    };
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    // iOS doesn't support beforeinstallprompt
    if (platform === "ios") {
      return false;
    }

    if (!deferredPrompt) {
      return false;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt, platform]);

  return {
    isInstallable,
    isInstalled,
    platform,
    isInstalling,
    install,
    iosInstallInstructions: IOS_INSTRUCTIONS,
  };
}
