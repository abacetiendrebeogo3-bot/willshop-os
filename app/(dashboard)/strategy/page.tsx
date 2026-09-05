"use client";

import React, { useState } from "react";
import {
  Target,
  TrendingUp,
  ShieldAlert,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  Flame,
  FileText,
  Activity,
  Plus,
  Sparkles,
  OctagonAlert,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";

export default function StrategyCockpitPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "goals" | "initiatives" | "roadmap" | "risks_decisions" | "recommendations"
  >("overview");

  // Mock Strategic Goals
  const [goals] = useState([
    {
      id: "sgoal_1",
      title: "Atteindre 2 000 000 FCFA de Contribution Profit Mensuelle",
      type: "FINANCIAL",
      kpiKey: "contribution_profit",
      baseline: 500000,
      target: 2000000,
      current: 1350000,
      unit: "FCFA",
      status: "ON_TRACK",
      forecast: 1950000,
      confidence: "HIGH",
      dueDate: "31 Déc 2026",
    },
    {
      id: "sgoal_2",
      title: "Atteindre un taux de livraison réussie ≥ 92%",
      type: "OPERATIONS",
      kpiKey: "delivery_rate",
      baseline: 80.0,
      target: 92.0,
      current: 85.5,
      unit: "%",
      status: "AT_RISK",
      forecast: 88.0,
      confidence: "MEDIUM",
      dueDate: "30 Nov 2026",
    },
    {
      id: "sgoal_3",
      title: "Réduire le CAC global sous 2 500 FCFA",
      type: "MARKETING",
      kpiKey: "cac",
      baseline: 4200,
      target: 2500,
      current: 3100,
      unit: "FCFA",
      status: "ON_TRACK",
      forecast: 2450,
      confidence: "HIGH",
      dueDate: "31 Déc 2026",
    },
  ]);

  // Mock Initiatives
  const [initiatives] = useState([
    {
      id: "init_1",
      title: "Campagne Marketing WhatsApp Retargeting Client VIP",
      impact: "HIGH",
      urgency: "HIGH",
      effort: "MEDIUM",
      risk: "LOW",
      score: 11.5,
      budget: 100000,
      expectedRevenue: 800000,
      expectedProfit: 350000,
      roi: 350,
      status: "ACTIVE",
    },
    {
      id: "init_2",
      title: "Optimisation de la Flotte de Livreurs Zone Pikine/Guediawaye",
      impact: "HIGH",
      urgency: "HIGH",
      effort: "HIGH",
      risk: "MEDIUM",
      score: 8.5,
      budget: 150000,
      expectedRevenue: 400000,
      expectedProfit: 180000,
      roi: 120,
      status: "PLANNED",
    },
    {
      id: "init_3",
      title: "Refonte du Catalogue Produit & Packs Promotionnels",
      impact: "MEDIUM",
      urgency: "LOW",
      effort: "LOW",
      risk: "LOW",
      score: 7.0,
      budget: 50000,
      expectedRevenue: 300000,
      expectedProfit: 120000,
      roi: 240,
      status: "ACTIVE",
    },
  ]);

  // Mock Recommendations (Stop/Start/Continue)
  const [recommendations] = useState([
    {
      action: "CONTINUE",
      title: "Accélérer l'initiative 'Campagne Marketing WhatsApp VIP'",
      reason: "Fort impact stratégique (Score 11.5) et ROI prévisionnel de +350%.",
      evidence: "CA généré: 800 000 FCFA, Marge nette respectée.",
      confidence: "HIGH",
    },
    {
      action: "START",
      title: "Lancer une initiative spécifique sur le délai de retour livreurs Fann",
      reason: "L'objectif Taux de Livraison est étiqueté AT_RISK (85.5% vs cible 92%).",
      evidence: "Analyse des goulots d'étranglement Delivery Build 11.",
      confidence: "HIGH",
    },
    {
      action: "STOP",
      title: "Arrêter les campagnes publicitaires manuelles non tracées",
      reason: "Absence de tag d'attribution UTM certifié entrainant un risque de dépenses à fonds perdus.",
      evidence: "Attribution confident (LOW) signalée sur 3 dépenses.",
      confidence: "MEDIUM",
    },
  ]);

  // Mock Strategic Risks
  const [risks] = useState([
    {
      id: "risk_1",
      title: "Hausse des coûts publicitaires Meta (CAC deterioration)",
      probability: "HIGH",
      impact: "MEDIUM",
      score: 6,
      category: "HIGH",
      mitigation: "Réguler les budgets pub automatiquement via MarketingBudgetService si ROI < 1.0",
      status: "OPEN",
    },
    {
      id: "risk_2",
      title: "Rupture de stock sur les T-Shirts Premium Gagnants",
      probability: "MEDIUM",
      impact: "HIGH",
      score: 6,
      category: "HIGH",
      mitigation: "Recommander réapprovisionnement automatique dès seuil stock bas (10 unités)",
      status: "MONITORED",
    },
  ]);

  return (
    <div className="min-h-screen bg-[#0A0A10] text-[#F0EFF4] p-6 space-y-8 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#7B61FF]/10 rounded-2xl border border-[#7B61FF]/20 text-[#7B61FF]">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Strategy & Goals Cockpit
                <span className="px-3 py-1 bg-[#7B61FF]/20 text-[#7B61FF] text-xs font-mono rounded-full border border-[#7B61FF]/30">
                  BUILD 12
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Le système stratégique de WillShop OS — Relie la vision du CEO à l&apos;exécution opérationnelle.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#12121A] hover:bg-[#1A1A26] text-gray-300 font-medium rounded-xl border border-[#1E1E2C] transition-all text-sm">
            <Sparkles className="w-4 h-4 text-[#7B61FF]" />
            Simuler Scénario What-If
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg shadow-[#7B61FF]/20 text-sm">
            <Plus className="w-4 h-4" />
            Nouvel Objectif
          </button>
        </div>
      </div>

      {/* STRATEGY HEALTH BANNER */}
      <div className="bg-gradient-to-r from-[#12121A] via-[#161624] to-[#12121A] border border-[#7B61FF]/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold rounded-full border border-emerald-500/20">
                🟢 VISION ACTIVE (2026)
              </span>
              <span className="text-xs text-gray-400 font-mono">Alignement Stratégique: 88%</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Stratégie de Croissance & Rentabilité WillShop 2026
            </h2>
            <p className="text-sm text-gray-300">
              « Devenir la plateforme e-commerce d&apos;excellence en Afrique de l&apos;Ouest, reconnue pour la qualité et la fiabilité de ses livraisons. »
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#0A0A10]/80 p-4 rounded-xl border border-[#1E1E2C]">
            <div className="text-center">
              <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Health Score</span>
              <div className="text-4xl font-extrabold text-[#7B61FF]">82<span className="text-sm text-gray-400 font-normal">/100</span></div>
            </div>
            <div className="h-10 w-[1px] bg-[#181824]" />
            <div className="text-xs text-gray-300 space-y-1">
              <p>Finance: <span className="font-bold text-emerald-400">85%</span></p>
              <p>Ventes: <span className="font-bold text-emerald-400">80%</span></p>
              <p>Opérations: <span className="font-bold text-amber-400">75%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#181824] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Compass className="w-4 h-4" />
          Vue Stratégique
        </button>

        <button
          onClick={() => setActiveTab("goals")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "goals"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Target className="w-4 h-4" />
          Objectifs & Trajectoires (Goals)
        </button>

        <button
          onClick={() => setActiveTab("initiatives")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "initiatives"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Initiatives & Plan 90 Jours
        </button>

        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "recommendations"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Zap className="w-4 h-4" />
          Stop / Start / Continue
        </button>

        <button
          onClick={() => setActiveTab("risks_decisions")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "risks_decisions"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Risques & Décisions
        </button>
      </div>

      {/* TAB CONTENT: OBJECTIVES & GOALS */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals.map((g) => {
              const progress = Math.round(((g.current - g.baseline) / (g.target - g.baseline)) * 100);

              return (
                <div
                  key={g.id}
                  className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 hover:border-[#7B61FF]/40 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-[#181824] text-xs font-mono text-gray-300 rounded">
                      {g.type}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border font-mono ${
                        g.status === "ON_TRACK"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-lg leading-snug">{g.title}</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Progression</span>
                      <span className="font-mono text-white font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-[#181824] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          g.status === "ON_TRACK" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#0A0A10] p-3 rounded-xl border border-[#181824]">
                    <div>
                      <span className="text-gray-400">Actuel:</span>
                      <p className="font-bold text-white font-mono">{g.current.toLocaleString()} {g.unit}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Cible:</span>
                      <p className="font-bold text-[#7B61FF] font-mono">{g.target.toLocaleString()} {g.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-[#181824]">
                    <span>Source KPI: <code className="text-[#7B61FF]">{g.kpiKey}</code></span>
                    <span className="font-mono">Échéance: {g.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INITIATIVES */}
      {activeTab === "initiatives" && (
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#7B61FF]" />
            Initiatives Stratégiques Priorisées (Score d&apos;Impact vs Effort)
          </h2>

          <div className="space-y-3">
            {initiatives.map((init) => (
              <div
                key={init.id}
                className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 hover:border-[#7B61FF]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-[#7B61FF]/20 text-[#7B61FF] text-xs font-mono font-bold rounded">
                      Score: {init.score}
                    </span>
                    <h4 className="font-bold text-white text-base">{init.title}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 pt-1">
                    <span>Impact: <strong className="text-emerald-400">{init.impact}</strong></span>
                    <span>•</span>
                    <span>Urgence: <strong className="text-amber-400">{init.urgency}</strong></span>
                    <span>•</span>
                    <span>Effort: <strong className="text-gray-300">{init.effort}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-6 bg-[#12121A] p-3 rounded-xl border border-[#181824] text-xs font-mono">
                  <div>
                    <span className="text-gray-400">Budget:</span>
                    <p className="font-bold text-white">{init.budget.toLocaleString()} F</p>
                  </div>
                  <div>
                    <span className="text-gray-400">CA Attendu:</span>
                    <p className="font-bold text-emerald-400">{init.expectedRevenue.toLocaleString()} F</p>
                  </div>
                  <div>
                    <span className="text-gray-400">ROI Attendu:</span>
                    <p className="font-bold text-[#7B61FF]">+{init.roi}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: RECOMMENDATIONS */}
      {activeTab === "recommendations" && (
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Analyse Stratégique : Stop / Start / Continue
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`bg-[#0A0A10] border rounded-2xl p-5 space-y-3 ${
                  rec.action === "STOP"
                    ? "border-rose-500/30"
                    : rec.action === "START"
                    ? "border-amber-500/30"
                    : "border-emerald-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-full border ${
                      rec.action === "STOP"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : rec.action === "START"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {rec.action}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Confiance: {rec.confidence}</span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{rec.title}</h3>
                <p className="text-xs text-gray-300">{rec.reason}</p>

                <div className="p-3 bg-[#12121A] rounded-xl border border-[#181824] text-xs text-gray-400 font-mono">
                  Preuve: {rec.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: RISKS & DECISIONS */}
      {activeTab === "risks_decisions" && (
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Matrice des Risques Stratégiques
            </h2>

            <div className="space-y-3">
              {risks.map((r) => (
                <div key={r.id} className="bg-[#0A0A10] border border-rose-500/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{r.title}</span>
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-mono font-bold rounded">
                      Score Risque: {r.score}/9 ({r.category})
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">Plan d&apos;atténuation: {r.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
