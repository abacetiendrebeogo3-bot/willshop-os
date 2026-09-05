"use client";

import React, { useState } from "react";
import {
  User,
  Heart,
  Target,
  CheckSquare,
  Flame,
  BookOpen,
  DollarSign,
  PieChart,
  Brain,
  Sparkles,
  Calendar,
  Layers,
  Briefcase,
  TrendingUp,
  Plus,
  Zap,
  ShieldCheck,
  Award,
} from "lucide-react";

export default function WiltyPersonalCockpitPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "goals_projects" | "tasks_habits" | "finance" | "learning_decisions" | "ai_briefing"
  >("overview");

  // Mock Personal Goals
  const [goals] = useState([
    {
      id: "pgoal_1",
      title: "Constituer un fond de sécurité personnel de 5 000 000 FCFA",
      category: "FINANCIAL",
      current: 1850000,
      target: 5000000,
      unit: "FCFA",
      progress: 37,
      status: "ACTIVE",
    },
    {
      id: "pgoal_2",
      title: "Conserver une régularité de lecture stratégie & IA (7j/7)",
      category: "LEARNING",
      current: 24,
      target: 30,
      unit: "jours",
      progress: 80,
      status: "ACTIVE",
    },
  ]);

  // Mock Personal Tasks
  const [tasks] = useState([
    {
      id: "ptask_1",
      title: "Revue hebdomadaire du patrimoine personnel & solde BOA",
      priority: "HIGH",
      status: "TODO",
      dueDate: "Aujourd'hui",
    },
    {
      id: "ptask_2",
      title: "Planification session apprentissage IA Agentic Coding",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: "Aujourd'hui",
    },
  ]);

  // Mock Personal Habits
  const [habits] = useState([
    {
      id: "phabit_1",
      name: "Lecture quotidienne 30 min (Business/Stratégie)",
      streak: 14,
      bestStreak: 28,
      adherence: 95,
      target: "7j/7",
    },
    {
      id: "phabit_2",
      name: "Session de sport / marche active 45 min",
      streak: 5,
      bestStreak: 12,
      adherence: 80,
      target: "4j/7",
    },
  ]);

  // Personal Financial Accounts (Strictly Scope = Personal, isolated via RLS)
  const [accounts] = useState([
    { id: "pacc_1", name: "Compte Bancaire Personnel (Ledger Isolé)", type: "BANK", balance: 1500000, currency: "FCFA", scope: "personal" },
    { id: "pacc_2", name: "Caisse Personnelle & Mobile Money", type: "MOBILE_MONEY", balance: 350000, currency: "FCFA", scope: "personal" },
    { id: "pacc_3", name: "Épargne de Précaution (Placement)", type: "SAVINGS", balance: 2000000, currency: "FCFA", scope: "personal" },
  ]);

  // Dynamic Net Worth Calculation (Assets - Liabilities) strictly within Personal Scope
  const assetsTotal = accounts.reduce((acc, a) => acc + a.balance, 0) + 1200000; // + Investment valuation
  const liabilitiesTotal = 300000;
  const netWorth = assetsTotal - liabilitiesTotal;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#7B61FF]/10 rounded-2xl border border-[#7B61FF]/20 text-[#7B61FF]">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Wilty Personal OS — Life Cockpit
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded-full border border-emerald-500/30">
                  BUILD 13 (PERSONAL SCOPE)
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Le système d&apos;exploitation personnel de Willy Tiendré — Centralise vie, finances, objectifs, habitudes & Personal AI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#12121A] hover:bg-[#1A1A26] text-gray-300 font-medium rounded-xl border border-[#1E1E2C] transition-all text-sm">
            <Sparkles className="w-4 h-4 text-[#7B61FF]" />
            Wilty Daily Briefing
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg shadow-[#7B61FF]/20 text-sm">
            <Plus className="w-4 h-4" />
            Ajouter Entrée
          </button>
        </div>
      </div>

      {/* LIFE SNAPSHOT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Patrimoine Net (Net Worth)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{netWorth.toLocaleString()} F</div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-mono">
            Assets: {assetsTotal.toLocaleString()} F | Liabilities: {liabilitiesTotal.toLocaleString()} F
          </div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Priorité #1 du Jour</span>
            <Target className="w-4 h-4 text-[#7B61FF]" />
          </div>
          <div className="text-base font-bold text-white leading-tight">
            Revue du patrimoine personnel & solde BOA
          </div>
          <div className="text-xs text-[#7B61FF] mt-1 font-mono">Consolidé ce matin</div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Habitude Streak Actuel</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono">14 <span className="text-sm font-normal text-gray-400">jours</span></div>
          <div className="text-xs text-gray-400 mt-1 font-mono">Lecture quotidienne 30 min</div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Isolation Domaine</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 font-mono">100% <span className="text-xs font-normal text-gray-400">Étanche</span></div>
          <div className="text-xs text-purple-300 mt-1 font-mono">Scope = Personal (RLS Active)</div>
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
          <User className="w-4 h-4" />
          Life Overview
        </button>

        <button
          onClick={() => setActiveTab("goals_projects")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "goals_projects"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Target className="w-4 h-4" />
          Objectifs & Projets
        </button>

        <button
          onClick={() => setActiveTab("tasks_habits")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "tasks_habits"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Flame className="w-4 h-4" />
          Tâches & Habitudes
        </button>

        <button
          onClick={() => setActiveTab("finance")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "finance"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Finances & Patrimoine
        </button>

        <button
          onClick={() => setActiveTab("learning_decisions")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "learning_decisions"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Apprentissage & Décisions
        </button>

        <button
          onClick={() => setActiveTab("ai_briefing")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "ai_briefing"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Brain className="w-4 h-4" />
          Wilty Personal AI
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#7B61FF]" />
              Tâches Personnelles du Jour
            </h2>

            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-[#7B61FF]/20 text-[#7B61FF] text-[10px] font-mono font-bold rounded">
                      {t.priority}
                    </span>
                    <h4 className="font-semibold text-white text-sm">{t.title}</h4>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{t.dueDate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Séries de Régularité & Habitudes (Streaks)
            </h2>

            <div className="space-y-3">
              {habits.map((h) => (
                <div key={h.id} className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white text-sm">{h.name}</h4>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-xs rounded font-bold">
                      {h.streak} jours streak
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                    <span>Adhérence 30j: {h.adherence}%</span>
                    <span>Cible: {h.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FINANCE */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Comptes Financiers Personnels (Ledger Isolé)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map((acc) => (
                <div key={acc.id} className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                    <span>{acc.type}</span>
                    <span className="text-emerald-400 font-bold">Scope = personal</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{acc.name}</h3>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">{acc.balance.toLocaleString()} {acc.currency}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WILTY PERSONAL AI */}
      {activeTab === "ai_briefing" && (
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#7B61FF]" />
            Wilty Daily Briefing — Personal Life CEO
          </h2>

          <div className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 space-y-4">
            <div className="space-y-1 border-b border-[#181824] pb-3">
              <span className="text-xs text-gray-400 font-mono">BRIEFING MATINAL</span>
              <h3 className="font-bold text-white text-lg">Situation Personnelle Globale</h3>
              <p className="text-xs text-gray-300">
                Bonjour Willy. Vous avez 2 tâches au programme aujourd&apos;hui et vos 3 comptes personnels affichent un solde disponible cumulé de 3 850 000 FCFA.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-amber-400 font-mono font-bold uppercase">Recommandation Principale</span>
              <p className="text-sm text-white">
                Finalisez en priorité la revue du patrimoine personnel ce matin, puis consacrez 30 min à votre habitude de lecture quotidienne.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
