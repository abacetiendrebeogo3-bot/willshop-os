"use client";

import React, { useState } from "react";
import {
  Users,
  CheckSquare,
  AlertTriangle,
  Clock,
  Briefcase,
  Target,
  Flame,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Plus,
  Filter,
  Layers,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { DataSourceBadge } from "@/components/ui/data-source-badge";

export default function TeamCockpitPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "workload" | "kanban" | "scorecards" | "escalations">("overview");

  // Team SSOT Data (TeamApplicationServices)
  // Team SSOT Data (TeamApplicationServices)
  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [bottlenecks] = useState<any[]>([]);

  const overdueTasks = tasks.filter((t) => t.status === "OVERDUE").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#7B61FF]/10 rounded-2xl border border-[#7B61FF]/20 text-[#7B61FF]">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Team & Productivity Cockpit
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Le moteur d&apos;exécution de WillShop OS — Connecte objectifs, tâches, charge, performance & escalades.
              </p>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg shadow-[#7B61FF]/20">
          <Plus className="w-4 h-4" />
          Nouvelle Tâche
        </button>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Membres Actifs</span>
            <DataSourceBadge type={employees.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{employees.length}</div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-mono">
            <UserCheck className="w-3.5 h-3.5" /> Enregistrés en base
          </div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Tâches Ouvertes</span>
            <DataSourceBadge type={tasks.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{tasks.length}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">En cours d&apos;exécution</div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">En Retard (Overdue)</span>
            <DataSourceBadge type={overdueTasks > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{overdueTasks}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Tâches hors délai
          </div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Tâches Bloquées</span>
            <DataSourceBadge type={blockedTasks > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-rose-400 font-mono">{blockedTasks}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Blocages actifs</div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Escalades Actives</span>
            <DataSourceBadge type={escalations.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-purple-400 font-mono">{escalations.length}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Suivi automatique
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#181824] pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "overview"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Layers className="w-4 h-4" />
          Vue d&apos;Ensemble Équipe
        </button>

        <button
          onClick={() => setActiveTab("workload")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "workload"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Charge de Travail (Workload)
        </button>

        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "kanban"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Tableau Kanban
        </button>

        <button
          onClick={() => setActiveTab("scorecards")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "scorecards"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Performance & Fiches Scorecards
        </button>

        <button
          onClick={() => setActiveTab("escalations")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "escalations"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Escalades & Goulets d&apos;Étranglement
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7B61FF]" />
              Membres de l&apos;Équipe WillShop
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 hover:border-[#7B61FF]/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{emp.name}</h3>
                      <span className="text-xs text-gray-400 font-mono">{emp.role}</span>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                        emp.workloadStatus === "OVERLOADED"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {emp.workloadStatus}
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 space-y-1">
                    <p>Tâches ouvertes: <span className="font-bold text-white">{emp.openTasks}</span></p>
                    <p>Dont urgentes: <span className="font-bold text-amber-400">{emp.urgentTasks}</span></p>
                    <p>Score de performance: <span className="font-bold text-[#7B61FF]">{emp.score}/100</span></p>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2 border-t border-[#181824]">
                    {emp.skills?.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-[#181824] text-gray-300 text-[10px] rounded font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: KANBAN */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["TODO", "IN_PROGRESS", "BLOCKED", "DONE"].map((statusColumn) => (
            <div key={statusColumn} className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#181824] pb-3">
                <span className="font-bold text-sm font-mono text-gray-300 uppercase tracking-wider">
                  {statusColumn}
                </span>
                <span className="px-2 py-0.5 bg-[#181824] text-xs font-mono rounded text-gray-400">
                  {tasks.filter((t) => t.status === statusColumn).length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === statusColumn)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-4 space-y-2 hover:border-[#7B61FF]/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-semibold ${
                            task.priority === "URGENT"
                              ? "bg-rose-500/20 text-rose-400"
                              : task.priority === "HIGH"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-gray-400 text-[10px] font-mono">{task.source}</span>
                      </div>

                      <h4 className="font-medium text-white text-sm">{task.title}</h4>

                      {task.blocker && (
                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300">
                          Motif: {task.blocker}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-[#181824]">
                        <span>{task.assignedTo}</span>
                        <span className="font-mono">{task.dueAt}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: ESCALATIONS & BOTTLENECKS */}
      {activeTab === "escalations" && (
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Escalades de Tâches en Retard
            </h2>

            <div className="space-y-3">
              {escalations.map((esc) => (
                <div
                  key={esc.id}
                  className="bg-[#0A0A10] border border-amber-500/30 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-mono font-bold rounded">
                        Level {esc.level}
                      </span>
                      <h4 className="font-semibold text-white">{esc.taskTitle}</h4>
                    </div>
                    <p className="text-xs text-gray-400">{esc.reason}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400 font-mono">
                    <p>Assigné: {esc.assignedTo}</p>
                    <p>{esc.triggeredAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7B61FF]" />
              Goulets d&apos;Étranglement de Processus (Process Bottlenecks)
            </h2>

            <div className="space-y-3">
              {bottlenecks.map((b) => (
                <div key={b.source} className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono text-sm">{b.source}</span>
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-mono rounded">
                      {b.severity} SEVERITY
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{b.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
