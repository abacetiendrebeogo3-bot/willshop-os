"use client";

import React from "react";
import { WifiOff, RefreshCw, ShieldAlert } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="bg-[#12121A] border border-[#181824] p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-wide">Connexion Interrompue</h1>
          <p className="text-xs text-gray-400 leading-relaxed font-mono">
            WILLShop OS synchronise vos conversations WhatsApp, vos commandes et vos livraisons en temps réel. Une connexion réseau est nécessaire pour accéder à ces données sécurisées.
          </p>
        </div>

        <div className="p-3 bg-[#0A0A14] border border-[#242436] rounded-2xl flex items-center gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-[11px] text-gray-300 font-mono">
            Vos données sensibles ne sont jamais conservées hors-ligne par mesure de sécurité.
          </p>
        </div>

        <button
          onClick={handleRetry}
          className="w-full py-3.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs font-mono"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer de se connecter
        </button>
      </div>
    </div>
  );
}
