"use client";

import React, { useState } from "react";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Sliders,
  Layers,
  FileCode2,
} from "lucide-react";

export default function AutomationDashboardPage() {
  const [activeTab, setActiveTab] = useState<"rules" | "approval" | "logs">("rules");
  const [globalKillSwitch, setGlobalKillSwitch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Mock Rules Data
  const [rules, setRules] = useState([
    {
      id: "rule_1",
      name: "Alerte Stock Bas",
      category: "STOCK",
      enabled: true,
      trigger: "stock.low",
      permission: "GREEN",
      executions: 14,
      lastRun: "Il y a 12 min",
    },
    {
      id: "rule_2",
      name: "Alerte Rupture de Stock",
      category: "STOCK",
      enabled: true,
      trigger: "stock.out",
      permission: "GREEN",
      executions: 3,
      lastRun: "Hier, 18:45",
    },
    {
      id: "rule_3",
      name: "Suivi Livraison Échouée",
      category: "DELIVERY",
      enabled: true,
      trigger: "delivery.failed",
      permission: "GREEN",
      executions: 8,
      lastRun: "Il y a 1h",
    },
    {
      id: "rule_4",
      name: "Confirmation Livraison Réussie",
      category: "DELIVERY",
      enabled: true,
      trigger: "delivery.delivered",
      permission: "GREEN",
      executions: 42,
      lastRun: "Il y a 5 min",
    },
    {
      id: "rule_5",
      name: "Notification Paiement Reçu",
      category: "FINANCE",
      enabled: true,
      trigger: "payment.received",
      permission: "GREEN",
      executions: 29,
      lastRun: "Il y a 35 min",
    },
    {
      id: "rule_6",
      name: "Objectif Entreprise à Risque",
      category: "BI",
      enabled: true,
      trigger: "goal.at_risk",
      permission: "GREEN",
      executions: 2,
      lastRun: "Hier, 09:00",
    },
    {
      id: "rule_7",
      name: "Alerte Anomalie BI",
      category: "BI",
      enabled: true,
      trigger: "anomaly.detected",
      permission: "GREEN",
      executions: 5,
      lastRun: "Il y a 2h",
    },
    {
      id: "rule_8",
      name: "Approbation Dépense Importante",
      category: "FINANCE",
      enabled: true,
      trigger: "finance.expense_created",
      permission: "YELLOW",
      executions: 6,
      lastRun: "Il y a 4h",
    },
  ]);

  // Mock Pending Approvals
  const [approvals, setApprovals] = useState([
    {
      id: "appr_101",
      automationName: "Approbation Dépense Importante",
      actionType: "CREATE",
      permissionLevel: "YELLOW",
      risk: "MEDIUM",
      reason: "Création de dépense > 100 000 XOF (Fournisseur Emballage #42)",
      evidence: { amount: 150000, currency: "XOF", category: "OpEx", requester: "Agent Finance" },
      requestedAt: "Il y a 15 min",
      expiresIn: "47h 45m",
      status: "PENDING_APPROVAL",
    },
    {
      id: "appr_102",
      automationName: "Relance WhatsApp Client VIP",
      actionType: "WHATSAPP",
      permissionLevel: "YELLOW",
      risk: "MEDIUM",
      reason: "Envoi automatique d'une offre commerciale personnalisée",
      evidence: { customer: "Amadou Diallo", phone: "+226 70 00 11 22", totalOrders: 7 },
      requestedAt: "Il y a 1h 20m",
      expiresIn: "46h 40m",
      status: "PENDING_APPROVAL",
    },
  ]);

  // Mock Executions Log
  const executions = [
    {
      id: "exec_501",
      ruleName: "Confirmation Livraison Réussie",
      trigger: "delivery.delivered",
      status: "COMPLETED",
      idempotencyKey: "rule_4_evt_991_act_1",
      timestamp: "05/09 02:05:12",
      duration: "42ms",
    },
    {
      id: "exec_502",
      ruleName: "Notification Paiement Reçu",
      trigger: "payment.received",
      status: "COMPLETED",
      idempotencyKey: "rule_5_evt_989_act_1",
      timestamp: "05/09 01:45:00",
      duration: "38ms",
    },
    {
      id: "exec_503",
      ruleName: "Approbation Dépense Importante",
      trigger: "finance.expense_created",
      status: "WAITING_APPROVAL",
      idempotencyKey: "rule_8_evt_985_act_1",
      timestamp: "05/09 01:10:22",
      duration: "18ms",
    },
  ];

  const handleToggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleApprove = (id: string) => {
    setApprovals(approvals.filter((a) => a.id !== id));
  };

  const handleReject = (id: string) => {
    setApprovals(approvals.filter((a) => a.id !== id));
  };

  const filteredRules =
    selectedCategory === "ALL" ? rules : rules.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Moteur d'Automatisation & Approval Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build 08 • Orchestration déterministe, règles métier et validation des actions sensibles
          </p>
        </div>

        {/* Global Kill Switch Toggle */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${globalKillSwitch ? "text-red-500 animate-pulse" : "text-emerald-400"}`} />
            <span className="text-xs font-semibold text-slate-200">
              Kill Switch Global : {globalKillSwitch ? "ARRÊTÉ" : "ACTIF"}
            </span>
          </div>
          <button
            onClick={() => setGlobalKillSwitch(!globalKillSwitch)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              globalKillSwitch
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {globalKillSwitch ? "RÉACTIVER" : "STOP URGENCE"}
          </button>
        </div>
      </div>

      {/* Global Kill Switch Banner Warning */}
      {globalKillSwitch && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">ATTENTION — Le Kill Switch Global est activé</p>
              <p className="text-xs text-red-300">
                Toutes les exécutions d'automatisations et requêtes d'action sont immédiatement bloquées pour l'organisation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setGlobalKillSwitch(false)}
            className="px-3 py-1.5 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded-lg"
          >
            Désactiver le Kill Switch
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Automatisations</span>
            <Sliders className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{rules.filter((r) => r.enabled).length} / {rules.length}</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">100% Déterministes</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Approbations en Attente</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{approvals.length}</p>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Actions YELLOW / RED</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Exécutions Aujourd'hui</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">109</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">0 Doublons (Idempotent)</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Temps Moyen Exécution</span>
            <RefreshCw className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">32 ms</p>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Performance optimale</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("rules")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "rules"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Règles d'Automatisation ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("approval")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "approval"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Approval Center ({approvals.length})
          {approvals.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "logs"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Journal d'Exécution & Audit
        </button>
      </div>

      {/* TAB 1: RULES */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["ALL", "STOCK", "DELIVERY", "FINANCE", "BI", "SALES"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-800">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-100 text-sm">{rule.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {rule.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          rule.permission === "GREEN"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {rule.permission}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Trigger: <span className="text-blue-400">{rule.trigger}</span> • Exécutions: {rule.executions} • Dernier lancement: {rule.lastRun}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                        rule.enabled
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {rule.enabled ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      {rule.enabled ? "ACTIVE" : "PAUSÉE"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL CENTER */}
      {activeTab === "approval" && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-100 mb-1">Actions en Attente d'Approbation</h2>
            <p className="text-xs text-slate-400 mb-6">
              Conformément à la règle d'architecture : les actions 🟡 YELLOW et 🔴 RED ne sont JAMAIS exécutées automatiquement sur expiration d'un délai.
            </p>

            {approvals.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">Aucune demande en attente</p>
                <p className="text-xs text-slate-500 mt-1">Toutes les actions requérant validation ont été traitées.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((appr) => (
                  <div key={appr.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-100 text-sm">{appr.automationName}</h3>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {appr.id} • Action: {appr.actionType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          {appr.permissionLevel} ({appr.risk} RISK)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">Expire dans : {appr.expiresIn}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-200 mb-1">Raison de la demande :</p>
                      <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        {appr.reason}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Evidence / Payload source :
                      </p>
                      <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                        {JSON.stringify(appr.evidence, null, 2)}
                      </pre>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleReject(appr.id)}
                        className="px-4 py-2 text-xs font-semibold bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <X className="w-4 h-4" /> Refuser
                      </button>
                      <button
                        onClick={() => handleApprove(appr.id)}
                        className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950"
                      >
                        <Check className="w-4 h-4" /> Approuver & Exécuter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === "logs" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm">Dernières Exécutions de Workflow</h3>
            <span className="text-xs font-mono text-slate-400">Total: {executions.length} enregistrements</span>
          </div>
          <div className="divide-y divide-slate-800 font-mono text-xs">
            {executions.map((exec) => (
              <div key={exec.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{exec.ruleName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        exec.status === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {exec.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Event: <span className="text-blue-400">{exec.trigger}</span> • Idempotency: {exec.idempotencyKey}
                  </p>
                </div>
                <div className="text-right text-slate-400 text-[11px]">
                  <p>{exec.timestamp}</p>
                  <p className="text-emerald-400">Durée: {exec.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
