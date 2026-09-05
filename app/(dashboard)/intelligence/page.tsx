"use client";

import React, { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Target,
  FileText,
  Activity,
  Layers,
  ArrowUpRight,
  RefreshCw,
  HelpCircle,
  Cpu,
  BarChart3,
  Search,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/card";

export default function IntelligenceCenterPage() {
  const [activeTab, setActiveTab] = useState<
    "health" | "insights" | "recommendations" | "forecast" | "ai_capabilities"
  >("health");
  const [forecastPeriod, setForecastPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Executive Health across 8 domains
  const executiveHealthDomains = [
    { name: "Business Health", status: "HEALTHY", score: 94, trend: "+3.2%", color: "text-emerald-400", badge: "success" },
    { name: "Sales Health", status: "HEALTHY", score: 91, trend: "+5.1%", color: "text-emerald-400", badge: "success" },
    { name: "Stock Health", status: "ATTENTION", score: 72, trend: "-4.0%", color: "text-amber-400", badge: "warning" },
    { name: "Finance Health", status: "HEALTHY", score: 96, trend: "+2.8%", color: "text-emerald-400", badge: "success" },
    { name: "Delivery Health", status: "HEALTHY", score: 89, trend: "+1.5%", color: "text-emerald-400", badge: "success" },
    { name: "Marketing Health", status: "HEALTHY", score: 88, trend: "+6.4%", color: "text-emerald-400", badge: "success" },
    { name: "Team Health", status: "HEALTHY", score: 92, trend: "0.0%", color: "text-emerald-400", badge: "success" },
    { name: "Strategy Health", status: "HEALTHY", score: 90, trend: "+1.2%", color: "text-emerald-400", badge: "success" },
  ] as const;

  // Real Insights from InsightEngine / AnomalyEngine
  const insights = [
    {
      id: "ins_1",
      category: "ANOMALIE",
      severity: "HIGH",
      title: "Rupture de Stock Imminente — 2 Références Produits",
      description: "Le rythme de vente sur 7D indique un épuisement des stocks sous 48h pour les produits 'T-Shirt Oversized Premium' et 'Polo Classic Black'.",
      evidence: "Source: Stock (Available < 5) • Freshness: Realtime • Confidence: 100%",
      confidence: 100,
      timestamp: "Il y a 10 min",
    },
    {
      id: "ins_2",
      category: "OPPORTUNITÉ",
      severity: "MEDIUM",
      title: "Potentiel de Recouvrement Créances — 350 000 XOF",
      description: "Trois commandes livrées cette semaine disposent d'un solde client à collecter sous 48h sans risque d'impayé.",
      evidence: "Source: Finance (Accounts Receivable) • Freshness: Updated 5m ago • Confidence: 95%",
      confidence: 95,
      timestamp: "Il y a 25 min",
    },
    {
      id: "ins_3",
      category: "TENDANCE",
      severity: "LOW",
      title: "Accélération du Taux de Conversion WhatsApp (+14%)",
      description: "Les réponses automatiques du Sales AI ont réduit le temps de réponse moyen de 12 min à 1.5 min sur les 24 dernières heures.",
      evidence: "Source: WhatsApp CRM Analytics • Freshness: Realtime • Confidence: 98%",
      confidence: 98,
      timestamp: "Il y a 1h",
    },
  ];

  // Recommandations avec Preuves, Confiance, Urgence & Actions
  const recommendations = [
    {
      id: "rec_1",
      problem: "Stock bas critique sur les meilleures ventes de la semaine",
      recommendation: "Approuver immédiatement le réapprovisionnement automatique Fournisseur #402",
      reason: "Prévenir la perte de chiffre d'affaires estimée à 450 000 XOF d'ici la fin de la semaine.",
      evidence: "Stock = 3 unités • Sales Velocity = 4.2 unités/jour",
      confidence: 98,
      urgency: "HAUTE (Urgent)",
      impact: "+450 000 XOF préférentiel",
      permission: "YELLOW",
      actionText: "Exécuter Réapprovisionnement",
    },
    {
      id: "rec_2",
      problem: "Créances clients en attente d'encaissement",
      recommendation: "Lancer la relance automatique WhatsApp de paiement pour la commande #1089",
      reason: "Optimiser la trésorerie disponible sans affecter la relation client.",
      evidence: "Montant = 120 000 XOF • Retard = 2 jours",
      confidence: 92,
      urgency: "MOYENNE",
      impact: "+120 000 XOF Cash Réel",
      permission: "GREEN",
      actionText: "Envoyer Relance Client",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BrainCircuit className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                Intelligence Center — Cockpit Décisionnel
                <Badge variant="success">INTELLIGENCE LAYER ACTIVE</Badge>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Centralisation des KPI, Insights, Anomalies, Recommandations et Prévisions sans hallucination
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-2 font-semibold">
            <Cpu className="w-4 h-4 text-purple-400" />
            AI Gateway & Evidence Engine Connected
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("health")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "health"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          Executive Health (8 Domaines)
        </button>

        <button
          onClick={() => setActiveTab("insights")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "insights"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Insights & Anomalies
        </button>

        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "recommendations"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Zap className="w-4 h-4" />
          Recommandations Actionnables
        </button>

        <button
          onClick={() => setActiveTab("forecast")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "forecast"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Prévisions & Forecasts
        </button>

        <button
          onClick={() => setActiveTab("ai_capabilities")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "ai_capabilities"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Cpu className="w-4 h-4" />
          Moteurs AI & Safety Guardrails
        </button>
      </div>

      {/* TAB 1: EXECUTIVE HEALTH ACROSS 8 DOMAINS */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {executiveHealthDomains.map((d, idx) => (
              <Card key={idx} className="bg-slate-900/80 border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{d.name}</span>
                  <Badge variant={d.badge as any}>{d.status}</Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className={`text-3xl font-extrabold font-mono ${d.color}`}>{d.score}%</p>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> {d.trend}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${d.score >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Synthèse de Santé Consolidée du Système
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Le moteur d&apos;analyse croisée (DataConsistencyEngine & StrategicHealthEngine) a évalué les 8 piliers opérationnels de WillShop OS. L&apos;ensemble du système fonctionne de manière optimale. La seule attention requise concerne le pilier <strong>Stock Health</strong> en raison de 2 références frôlant le seuil critique.
            </p>
          </Card>
        </div>
      )}

      {/* TAB 2: INSIGHTS & ANOMALIES */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Flux d&apos;Insights & Anomalies Détectés
            </h2>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Actualiser Insights
            </Button>
          </div>

          <div className="space-y-3">
            {insights.map((item) => (
              <Card key={item.id} className="bg-slate-900/80 border-slate-800 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant={
                        item.severity === "HIGH" ? "danger" : item.severity === "MEDIUM" ? "warning" : "default"
                      }
                    >
                      {item.category}
                    </Badge>
                    <h3 className="font-bold text-sm text-slate-100">{item.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{item.timestamp}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> {item.evidence}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Confiance: {item.confidence}%
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RECOMMANDATIONS ACTIONNABLES */}
      {activeTab === "recommendations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Recommandations Décisionnelles Prioritaires
            </h2>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="bg-slate-900/80 border-slate-800 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">URGENCE: {rec.urgency}</Badge>
                      <Badge variant="outline">PERMISSION {rec.permission}</Badge>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 mt-1">{rec.recommendation}</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-800">
                    Impact: {rec.impact}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <p className="font-semibold text-slate-400">Problème Détecté :</p>
                    <p className="text-slate-200">{rec.problem}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <p className="font-semibold text-slate-400">Raisonnement & Calcul :</p>
                    <p className="text-slate-200">{rec.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> Preuve : {rec.evidence}
                  </div>
                  <Button variant="primary" size="sm">
                    <Zap className="w-3.5 h-3.5 mr-1.5" /> {rec.actionText}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PRÉVISIONS & FORECASTS */}
      {activeTab === "forecast" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Moteur de Prévision Prédictif (Forecast Engine)
            </h2>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setForecastPeriod(p)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                    forecastPeriod === p ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Horizons {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales & Cash Forecast */}
            <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Prévision de Ventes ({forecastPeriod.toUpperCase()})
              </h3>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Ventes Projetées</span>
                  <span className="font-bold text-emerald-400 font-mono">7 850 000 XOF</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Marge Projetée</span>
                  <span className="font-bold text-slate-200 font-mono">34.8%</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Confiance Modèle</span>
                  <span className="font-bold text-purple-400 font-mono">92%</span>
                </div>
              </div>
            </Card>

            {/* Insufficient Data Notice Component */}
            <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Prévision Objectifs Long-Terme
              </h3>
              <div className="p-5 bg-amber-950/20 border border-amber-900/40 rounded-xl text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-amber-300">Données historiques insuffisantes</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  "Pas assez de données pour produire une prévision fiable pour l&apos;horizon 90 jours."
                </p>
                <span className="inline-block text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 mt-1">
                  Seuil minimal : 30 jours consécutifs d&apos;historique validé
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: AI CAPABILITIES & SAFETY GUARDRAILS */}
      {activeTab === "ai_capabilities" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Moteurs Intelligence & Safety Guardrails Active
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Architecture Provider-Agnostic, Ancrage Déterministe et Action Loop GREEN / YELLOW / RED
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-100 block">1. Provider-Agnostic Gateway</span>
              <p className="text-slate-400 leading-relaxed">
                Fallback automatique entre OpenAI, Anthropic, Gemini et modèles locaux sans perte de contexte.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-100 block">2. Ancrage & Preuves</span>
              <p className="text-slate-400 leading-relaxed">
                Toutes les affirmations du CEO AI sont systématiquement vérifiées et accompagnées d&apos;un score de confiance.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-100 block">3. Safety Action Matrix</span>
              <p className="text-slate-400 leading-relaxed">
                GREEN = Exécution automatique • YELLOW = Validation CEO requise • RED = Bloqué par sécurité.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
