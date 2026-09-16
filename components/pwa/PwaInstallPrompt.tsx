"use client";

import React, { useState, useEffect } from "react";
import { Download, X, CheckCircle2, Share, Smartphone, PlusSquare } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIosSafari, setIsIosSafari] = useState<boolean>(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if running in standalone mode (already installed & opened from home screen)
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isInStandaloneMode);
    if (isInStandaloneMode) return;

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem("willshop_pwa_prompt_dismissed");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 3600 * 24);
      if (daysSinceDismiss < 7) {
        return; // Don't show again within 7 days
      }
    }

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

    if (isIos && isSafari) {
      setIsIosSafari(true);
      setIsVisible(true);
      return;
    }

    // 3. Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalledSuccess(true);
      setIsVisible(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalledSuccess(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("willshop_pwa_prompt_dismissed", Date.now().toString());
    }
  };

  // Don't render if already running in standalone mode or prompt not active
  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-in">
      <div className="bg-[#12121A] border border-[#7B61FF]/40 rounded-3xl p-5 shadow-2xl space-y-4 backdrop-blur-xl relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#181824] transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {isInstalledSuccess ? (
          /* SUCCESS STATE */
          <div className="space-y-3 pr-6">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-mono">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>WILLShop est installé !</span>
            </div>
            <p className="text-xs text-gray-300 font-mono">
              Vous pouvez maintenant ouvrir l&apos;application directement depuis l&apos;écran d&apos;accueil de votre téléphone.
            </p>
          </div>
        ) : isIosSafari ? (
          /* SAFARI IOS INSTRUCTIONS STATE */
          <div className="space-y-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#7B61FF] text-white flex items-center justify-center font-bold font-mono text-lg shrink-0">
                W
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Installer WILLShop OS</h4>
                <p className="text-[11px] text-gray-400 font-mono">Application web pour iPhone</p>
              </div>
            </div>

            <div className="p-3 bg-[#0A0A14] border border-[#242436] rounded-2xl space-y-2 text-xs font-mono text-gray-300">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Share className="w-4 h-4 text-[#7B61FF]" /> Instructions Safari :
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-400">
                <li>Appuyez sur le bouton <span className="text-white font-bold font-sans">Partager ⎘</span> dans Safari.</li>
                <li>Faites défiler et sélectionnez <span className="text-white font-bold font-sans">&apos;Sur l&apos;écran d&apos;accueil&apos; ➕</span>.</li>
              </ol>
            </div>
          </div>
        ) : (
          /* ANDROID / CHROME INSTALL STATE */
          <div className="space-y-4">
            <div className="flex items-center gap-3 pr-6">
              <div className="w-10 h-10 rounded-2xl bg-[#7B61FF] text-white flex items-center justify-center font-bold font-mono text-lg shrink-0 shadow-lg">
                W
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">WILLShop OS</h4>
                <p className="text-[11px] text-gray-400 font-mono">
                  Votre espace de travail, directement sur votre téléphone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-3 px-4 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Installer WILLShop
              </button>

              <button
                onClick={handleDismiss}
                className="py-3 px-4 bg-[#181824] hover:bg-[#242436] text-gray-400 hover:text-white font-medium rounded-2xl transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
