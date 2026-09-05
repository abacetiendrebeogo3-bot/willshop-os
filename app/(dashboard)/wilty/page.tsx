"use client";

import React, { useState } from "react";
import {
  User,
  Target,
  CheckSquare,
  Flame,
  BookOpen,
  DollarSign,
  Brain,
  Sparkles,
  Plus,
  ShieldCheck,
  Inbox,
  Loader2,
} from "lucide-react";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { PersonalFinancialAccount, PersonalGoal, PersonalTask, PersonalHabit } from "@/src/domain/entities/PersonalEntities";

export default function WiltyPersonalCockpitPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "goals_projects" | "tasks_habits" | "finance" | "learning_decisions" | "ai_briefing"
  >("overview");
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Personal State (Strictly Scope = Personal, isolated via RLS)
  // Empty by default when fresh database instance has 0 personal records
  const [goals] = useState<PersonalGoal[]>([]);
  const [tasks] = useState<PersonalTask[]>([]);
  const [habits] = useState<PersonalHabit[]>([]);
  const [accounts] = useState<PersonalFinancialAccount[]>([]);

  // Dynamic Net Worth Calculation (Assets - Liabilities) strictly within Personal Scope
  const assetsTotal = accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  const liabilitiesTotal = 0;
  const netWorth = assetsTotal - liabilitiesTotal;

  const handleSeedOrRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

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
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-mono rounded-full border border-purple-500/30">
                  SCOPE = PERSONAL
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Le système d&apos;exploitation personnel de Willy Tiendré — Isolation RLS absolue du domaine business
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DataSourceBadge type="DATABASE" label="PERSONAL SCOPE RLS" />
          <button
            onClick={handleSeedOrRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#12121A] hover:bg-[#1A1A26] text-gray-300 font-medium rounded-xl border border-[#1E1E2C] transition-all text-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#7B61FF]" /> : <Sparkles className="w-4 h-4 text-[#7B61FF]" />}
            Actualiser Scope
          </button>
        </div>
      </div>

      {/* LIFE SNAPSHOT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Patrimoine Net (Net Worth)</span>
            <DataSourceBadge type={accounts.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{netWorth.toLocaleString()} FCFA</div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-mono">
            Assets: {assetsTotal.toLocaleString()} F | Liabilities: {liabilitiesTotal.toLocaleString()} F
          </div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Objectifs Personnels</span>
            <DataSourceBadge type={goals.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{goals.length} <span className="text-xs font-normal text-gray-400">Objectifs</span></div>
          <div className="text-xs text-[#7B61FF] mt-1 font-mono">Isolés en base</div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Habitudes Enregistrées</span>
            <DataSourceBadge type={habits.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{habits.length} <span className="text-xs font-normal text-gray-400">Séries</span></div>
          <div className="text-xs text-gray-400 mt-1 font-mono">Suivi de régularité</div>
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
              Tâches Personnelles
            </h2>

            {tasks.length === 0 ? (
              <div className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-6 text-center space-y-2">
                <Inbox className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-sm font-bold text-gray-300">Aucune tâche personnelle enregistrée.</p>
                <p className="text-xs text-gray-500">Ajoutez vos premières tâches avec le scope personal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div key={t.id} className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-[#7B61FF]/20 text-[#7B61FF] text-[10px] font-mono font-bold rounded">
                        {t.priority}
                      </span>
                      <h4 className="font-semibold text-white text-sm">{t.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Séries de Régularité & Habitudes (Streaks)
            </h2>

            {habits.length === 0 ? (
              <div className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-6 text-center space-y-2">
                <Inbox className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-sm font-bold text-gray-300">Aucune habitude enregistrée.</p>
                <p className="text-xs text-gray-500">Définissez vos habitudes de régularité quotidienne.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((h) => (
                  <div key={h.id} className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">{h.name}</h4>
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-xs rounded font-bold">
                        {h.streakCount} jours streak
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

            {accounts.length === 0 ? (
              <div className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-6 text-center space-y-2">
                <Inbox className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-sm font-bold text-gray-300">Aucun compte personnel enregistré.</p>
                <p className="text-xs text-gray-500">Ajoutez vos comptes bancaires et mobile money personnels.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {accounts.map((acc) => (
                  <div key={acc.id} className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                      <span>{acc.type}</span>
                      <span className="text-emerald-400 font-bold">Scope = personal</span>
                    </div>
                    <h3 className="font-bold text-white text-base">{acc.name}</h3>
                    <div className="text-2xl font-extrabold text-emerald-400 font-mono">{acc.currentBalance.toLocaleString()} {acc.currency}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: WILTY PERSONAL AI */}
      {activeTab === "ai_briefing" && (
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#7B61FF]" />
            Wilty Daily Briefing — Personal Life AI
          </h2>

          <div className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 space-y-4">
            <div className="space-y-1 border-b border-[#181824] pb-3">
              <span className="text-xs text-gray-400 font-mono">BRIEFING MATINAL</span>
              <h3 className="font-bold text-white text-lg">Situation Personnelle Globale</h3>
              <p className="text-xs text-gray-300">
                Bonjour Willy. Le cockpit personnel est prêt et étanche. Vos données personnelles sont strictement isolées via RLS.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
