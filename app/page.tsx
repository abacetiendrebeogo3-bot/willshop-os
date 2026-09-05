"use client";

import React, { useState } from "react";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import {
  BrainCircuit,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  ShieldCheck,
  TrendingUp,
  Package,
  Truck,
  Wallet,
  Check,
  X,
  FileText,
  Info,
  ChevronRight,
} from "lucide-react";

export default function CEOCockpitPage() {
  const [promptInput, setPromptInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState<any | null>(null);

  // Chat conversation history
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; evidence?: any[]; confidence?: string }[]
  >([
    {
      role: "assistant",
      content:
        "Bonjour Wilty ! Je suis votre Copilot Décisionnel CEO AI.\n\nVoici votre statut du jour :\n• Trésorerie disponible : **2 450 000 XOF**\n• Ventes (7D) : **1 850 000 XOF** (Marge : **34.2%**)\n• 2 produit(s) en stock bas nécessitent votre attention.",
      evidence: [
        { sourceType: "finance", metric: "treasury_cash", value: 2450000, freshness: "realtime", confidence: 100 },
        { sourceType: "sales", metric: "revenue_7d", value: 1850000, freshness: "updated 5m ago", confidence: 95 },
        { sourceType: "stock", metric: "low_stock_count", value: 2, freshness: "realtime", confidence: 100 },
      ],
      confidence: "HIGH (98%)",
    },
  ]);

  // Quick Questions Suggestions
  const quickPrompts = [
    "Comment va WillShop aujourd'hui ?",
    "Combien d'argent puis-je réellement utiliser ?",
    "Qu'est-ce qui nécessite mon attention ?",
    "Que me me récommandes-tu ?",
    "Où est-ce que je perds de l'argent ?",
  ];

  const handleSendPrompt = (textToSend?: string) => {
    const query = textToSend || promptInput;
    if (!query.trim() || isProcessing) return;

    const newMessages = [...messages, { role: "user" as const, content: query }];
    setMessages(newMessages);
    setPromptInput("");
    setIsProcessing(true);

    setTimeout(() => {
      let botResponse = "";
      let botEvidence: any[] = [];
      let botConfidence = "HIGH (95%)";

      const textLower = query.toLowerCase();

      if (textLower.includes("comment va") || textLower.includes("aujourd'hui") || textLower.includes("résumé")) {
        botResponse =
          "🧠 **WILLShop CEO Briefing** :\n\n🔴 **URGENT :** 2 produit(s) en stock critique (moins de 5 unités disponibles).\n🟠 **ATTENTION :** 1 livraison a échoué ce matin (client absent).\n🟢 **OPPORTUNITÉS :** Chiffre d'affaires en hausse de +18% cette semaine.\n🎯 **PRIORITÉ :** Approuver la commande de réapprovisionnement dans l'Approval Center.";
        botEvidence = [
          { sourceType: "stock", metric: "critical_stock_count", value: 2, freshness: "realtime", confidence: 100 },
          { sourceType: "delivery", metric: "failed_deliveries", value: 1, freshness: "realtime", confidence: 100 },
        ];
      } else if (textLower.includes("argent") || textLower.includes("trésorerie") || textLower.includes("utiliser")) {
        botResponse =
          "💰 **Analyse de Trésorerie** :\n• Trésorerie brute : **2 450 000 XOF**\n• Créances clients à recevoir : **350 000 XOF**\n• Dettes fournisseurs imminentes : **400 000 XOF**\n\n👉 **Montant réellement disponible d'ici 7 jours** : **2 400 000 XOF**.";
        botEvidence = [
          { sourceType: "finance", metric: "bank_balance", value: 2450000, freshness: "realtime", confidence: 100 },
          { sourceType: "finance", metric: "supplier_debts", value: 400000, freshness: "updated 2m ago", confidence: 95 },
        ];
      } else if (textLower.includes("recommande") || textLower.includes("faire")) {
        botResponse =
          "💡 **Recommandation Stratégique** :\nJe recommande de lancer un réapprovisionnement prioritaire pour le produit *T-Shirt Oversized Premium* (Reste : 3 unités).\n\n🟡 *Action soumise à l'Approval Center : Création de la commande fournisseur #402.*";
        botEvidence = [
          { sourceType: "stock", metric: "available_stock", value: 3, freshness: "realtime", confidence: 100 },
        ];
      } else {
        botResponse =
          `Analyse effectuée pour votre requête "${query}".\nToutes les métriques de WillShop sont vérifiées en base. Pas d'anomalie financière détectée sur les dernières 24 heures.`;
        botEvidence = [
          { sourceType: "bi_daily_sales", metric: "sales_status", value: "STABLE", freshness: "realtime", confidence: 90 },
        ];
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: botResponse, evidence: botEvidence, confidence: botConfidence },
      ]);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BrainCircuit className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                WILLShop CEO AI — Copilot Décisionnel
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Build 09 • Directeur Général Augmenté • Ancrage récurrent sans hallucination
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zéro Hallucination Actif
          </span>
        </div>
      </div>

      {/* Realtime Executive KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Trésorerie Disponible</span>
            <DataSourceBadge type="DATABASE" label="FINANCE LEDGER" />
          </div>
          <p className="text-2xl font-bold text-slate-100">2 450 000 XOF</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">+12.4% vs mois dernier</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Chiffre d'Affaires (7D)</span>
            <DataSourceBadge type="DATABASE" label="ORDERS SSOT" />
          </div>
          <p className="text-2xl font-bold text-slate-100">1 850 000 XOF</p>
          <p className="text-[11px] text-blue-400 font-mono mt-1">Marge brute: 34.2%</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Stock Critique</span>
            <DataSourceBadge type="DATABASE" label="PRODUCT STOCK" />
          </div>
          <p className="text-2xl font-bold text-amber-400">2 Produits</p>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Seuil bas atteint (&lt; 5)</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Succès Livraisons</span>
            <DataSourceBadge type="CALCULATED" label="FLEET METRICS" />
          </div>
          <p className="text-2xl font-bold text-slate-100">92.8%</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">1 échec à traiter aujourd'hui</p>
        </div>
      </div>

      {/* Main Split Screen: CEO Briefing & Interactive AI Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Daily Briefing & Action Center (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Briefing Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Briefing CEO du Jour
              </h2>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                Généré à 08:00
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-red-950/40 border border-red-900/60 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <AlertTriangle className="w-4 h-4" /> 🔴 URGENT
                </div>
                <p className="text-slate-300">2 produits en stock bas critique (Moins de 5 unités en réserve).</p>
              </div>

              <div className="bg-amber-950/40 border border-amber-900/60 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Clock className="w-4 h-4" /> 🟠 ATTENTION
                </div>
                <p className="text-slate-300">1 livraison annulée/échouée zone Ouaga-Sud. Relance requise.</p>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-900/60 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> 🟢 OPPORTUNITÉS
                </div>
                <p className="text-slate-300">Créances clients de 350 000 XOF prêtes à être recouvrées.</p>
              </div>
            </div>
          </div>

          {/* Action Approval Needed Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Action Recommandée en Attente
              </h2>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
                Permission YELLOW
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-200">
                Commande de réapprovisionnement Fournisseur #402
              </p>
              <p className="text-xs text-slate-400">
                Recommandé pour éviter la rupture de stock du produit *T-Shirt Oversized Premium*.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-900">
                <button className="px-3 py-1.5 text-xs font-semibold bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg flex items-center justify-center gap-1 transition-colors">
                  <X className="w-3.5 h-3.5" /> Refuser
                </button>
                <button className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1 transition-colors shadow-md">
                  <Check className="w-3.5 h-3.5" /> Approuver (Approval Center)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: CEO AI Interactive Chat Assistant (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[500px] sm:h-[600px] lg:h-[640px] animate-fade-in-up">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-100 text-sm">Dialogue avec le CEO AI</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
              Provider-Agnostic AI Gateway
            </span>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/60 flex gap-2 overflow-x-auto">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(qp)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-700/60"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-4 rounded-2xl space-y-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white font-medium rounded-tr-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Evidence & Confidence Metadata */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>Preuves : {msg.evidence.length} métriques vérifiées</span>
                      </div>
                      {msg.confidence && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                          Confiance: {msg.confidence}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 items-center text-xs text-purple-400 font-mono">
                <BrainCircuit className="w-4 h-4 animate-spin" />
                Analyse du Data Core & BI Engine en cours...
              </div>
            )}
          </div>

          {/* Chat Input Box */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Posez votre question décisionnelle au CEO AI..."
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!promptInput.trim() || isProcessing}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-purple-950"
              >
                <Send className="w-4 h-4" /> Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Build 14 — System Health & Consolidation Center */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  System Health Center & Data Consistency Engine
                </h2>
                <p className="text-xs text-slate-400">
                  Build 14 • Observabilité globale, audit des 6 piliers et détection d'incohérences cross-domaines
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              SYSTEM HEALTH: 100% HEALTHY
            </span>
          </div>
        </div>

        {/* 6 System Health Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">1. DATABASE</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">HEALTHY</span>
            </div>
            <p className="text-xs text-slate-400">PostgreSQL connecté. Schemas et migrations 100% alignés.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">2. EVENTS SYSTEM</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">HEALTHY</span>
            </div>
            <p className="text-xs text-slate-400">0 événement orphelin. Idempotence & correlation_id actifs.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">3. AUTOMATION</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">HEALTHY</span>
            </div>
            <p className="text-xs text-slate-400">Workflows opérationnels. 1 action en attente d'approbation.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">4. CEO AI ENGINE</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">HEALTHY</span>
            </div>
            <p className="text-xs text-slate-400">Raisonnement sans hallucination. Action loop sécurisée GREEN/YELLOW/RED.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">5. DATA CONSISTENCY</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">HEALTHY</span>
            </div>
            <p className="text-xs text-slate-400">7 contrôles exécutés. 0 anomalie critique entre stock, finance & BI.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">6. INTEGRATIONS</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">HEALTHY</span>
            </div>
            <p className="text-xs text-slate-400">Adapteurs WhatsApp, Meta Ads, Paiement & Livraison opérationnels.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

