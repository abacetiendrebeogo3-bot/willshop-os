"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/src/infrastructure/supabase/client";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
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
  X,
  Loader2,
  UserPlus,
  Award,
  ChevronRight,
  Ban,
  Play,
  RotateCcw
} from "lucide-react";

export default function TeamCockpitPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "workload" | "kanban" | "scorecards" | "escalations">("overview");

  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Database SSOT Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [employeeError, setEmployeeError] = useState("");

  // Employee Form State
  const [empFirstName, setEmpFirstName] = useState("");
  const [empLastName, setEmpLastName] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empJobTitle, setEmpJobTitle] = useState("");
  const [empRole, setEmpRole] = useState<"OWNER" | "MANAGER" | "COMMERCIAL" | "LIVREUR" | "VIEWER">("COMMERCIAL");
  const [empStatus, setEmpStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState("");

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskPriority, setTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [taskDueAt, setTaskDueAt] = useState("");

  // Blocker Modal State
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [selectedTaskToBlock, setSelectedTaskToBlock] = useState<any>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState("");

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Resolve OrgId
      const { data: roleData } = await supabase
        .from("user_organization_roles")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!roleData?.organization_id) {
        setLoading(false);
        return;
      }

      const activeOrgId = roleData.organization_id;
      setOrgId(activeOrgId);

      // Fetch team_employees
      const { data: empData } = await supabase
        .from("team_employees")
        .select("*")
        .eq("organization_id", activeOrgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setEmployees(empData || []);

      // Fetch team_tasks
      const { data: taskData } = await supabase
        .from("team_tasks")
        .select("*")
        .eq("organization_id", activeOrgId)
        .order("created_at", { ascending: false });

      setTasks(taskData || []);

      // Fetch task_escalations
      const { data: escData } = await supabase
        .from("task_escalations")
        .select("*")
        .eq("organization_id", activeOrgId)
        .order("triggered_at", { ascending: false });

      setEscalations(escData || []);
    } catch (err) {
      console.error("Erreur lors du chargement des données de l'équipe:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLER: CREATE EMPLOYEE ---
  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!empFirstName.trim() || !empLastName.trim() || !empPhone.trim()) {
      setEmployeeError("Le prénom, le nom et le téléphone sont obligatoires.");
      return;
    }

    if (!orgId) {
      setEmployeeError("Organisation introuvable.");
      return;
    }

    setIsSubmittingEmployee(true);
    setEmployeeError("");

    try {
      const supabase = createClient();

      const newEmpPayload = {
        organization_id: orgId,
        first_name: empFirstName.trim(),
        last_name: empLastName.trim(),
        phone: empPhone.trim(),
        email: empEmail.trim() || null,
        role: empRole,
        employment_status: empStatus,
        responsibilities: empJobTitle.trim() ? [empJobTitle.trim()] : [],
        activity_status: "ONLINE",
      };

      const { data, error } = await supabase
        .from("team_employees")
        .insert(newEmpPayload)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Reset form & reload
      setEmpFirstName("");
      setEmpLastName("");
      setEmpPhone("");
      setEmpEmail("");
      setEmpJobTitle("");
      setEmpRole("COMMERCIAL");
      setEmpStatus("ACTIVE");
      setIsEmployeeModalOpen(false);

      await loadTeamData();
    } catch (err: any) {
      setEmployeeError(err?.message || "Erreur lors de la création de l'employé.");
    } finally {
      setIsSubmittingEmployee(false);
    }
  }

  // --- HANDLER: CREATE TASK ---
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskError("Le titre de la tâche est obligatoire.");
      return;
    }

    if (!orgId || !currentUserId) {
      setTaskError("Session ou organisation introuvable.");
      return;
    }

    setIsSubmittingTask(true);
    setTaskError("");

    try {
      const supabase = createClient();

      const newTaskPayload = {
        organization_id: orgId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        status: "TODO",
        source: "MANUAL",
        created_by: currentUserId,
        assigned_to: taskAssignedTo || null,
        due_at: taskDueAt ? new Date(taskDueAt).toISOString() : null,
      };

      const { error } = await supabase.from("team_tasks").insert(newTaskPayload);

      if (error) {
        throw new Error(error.message);
      }

      // Reset form & reload
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignedTo("");
      setTaskPriority("MEDIUM");
      setTaskDueAt("");
      setIsTaskModalOpen(false);

      await loadTeamData();
    } catch (err: any) {
      setTaskError(err?.message || "Erreur lors de la création de la tâche.");
    } finally {
      setIsSubmittingTask(false);
    }
  }

  // --- HANDLER: TASK STATUS CHANGE ---
  async function handleUpdateTaskStatus(taskId: string, newStatus: string, blockerReason?: string) {
    if (!orgId) return;

    try {
      const supabase = createClient();
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "IN_PROGRESS") {
        updates.started_at = new Date().toISOString();
      } else if (newStatus === "DONE") {
        updates.completed_at = new Date().toISOString();
      } else if (newStatus === "BLOCKED") {
        updates.blocker_reason = blockerReason || "Blocage non précisé";
        updates.blocked_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("team_tasks")
        .update(updates)
        .eq("organization_id", orgId)
        .eq("id", taskId);

      if (error) {
        console.error("Erreur mise à jour statut tâche:", error.message);
      } else {
        await loadTeamData();
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la tâche:", err);
    }
  }

  // KPI Computations
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "DONE" &&
      t.due_at &&
      new Date(t.due_at).getTime() < Date.now()
  ).length;

  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
  const openTasks = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#7B61FF]" />
          <p className="text-sm font-mono">Chargement du Cockpit Équipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up pb-12">
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
                Le moteur d&apos;exécution de WillShop OS — Connecte employés, tâches, charge, performance & escalades.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEmployeeError("");
              setIsEmployeeModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#181824] hover:bg-[#202030] text-white font-medium rounded-xl border border-slate-700 transition-all font-mono text-xs"
          >
            <UserPlus className="w-4 h-4 text-[#7B61FF]" />
            + Ajouter un employé
          </button>

          <button
            onClick={() => {
              setTaskError("");
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg shadow-[#7B61FF]/20 font-mono text-xs"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Tâche
          </button>
        </div>
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
            <UserCheck className="w-3.5 h-3.5" /> Employés Supabase
          </div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Tâches Ouvertes</span>
            <DataSourceBadge type={openTasks > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{openTasks}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">En cours / À faire</div>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 hover:border-[#7B61FF]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">En Retard</span>
            <DataSourceBadge type={overdueTasks > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{overdueTasks}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Tâches hors délai
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
      <div className="flex flex-wrap items-center gap-2 border-b border-[#181824] pb-2">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#7B61FF]" />
                Membres de l&apos;Équipe WillShop ({employees.length})
              </h2>
              <button
                onClick={() => setIsEmployeeModalOpen(true)}
                className="text-xs font-mono text-[#7B61FF] hover:underline flex items-center gap-1"
              >
                + Enregistrer un membre
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="p-12 text-center bg-[#0A0A10] rounded-2xl border border-dashed border-[#1E1E2C] space-y-4">
                <UserCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Aucun employé enregistré</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Vous n&apos;avez pas encore ajouté de membre d&apos;équipe dans votre organisation.
                    Commencez par ajouter votre premier commercial ou manager.
                  </p>
                </div>
                <button
                  onClick={() => setIsEmployeeModalOpen(true)}
                  className="px-4 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium text-xs font-mono rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  + Ajouter un employé
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {employees.map((emp) => {
                  const empTasks = tasks.filter((t) => t.assigned_to === emp.id);
                  const empOpenTasks = empTasks.filter(
                    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
                  ).length;
                  const empUrgentTasks = empTasks.filter(
                    (t) => t.priority === "URGENT" || t.priority === "HIGH"
                  ).length;

                  return (
                    <div
                      key={emp.id}
                      className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 hover:border-[#7B61FF]/40 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#7B61FF]/10 border border-[#7B61FF]/20 flex items-center justify-center text-[#7B61FF] font-bold font-mono">
                              {emp.first_name?.[0]}
                              {emp.last_name?.[0]}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-base">
                                {emp.first_name} {emp.last_name}
                              </h3>
                              <span className="text-xs text-gray-400 font-mono">{emp.role}</span>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                              emp.employment_status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {emp.employment_status}
                          </span>
                        </div>

                        <div className="text-xs text-gray-300 space-y-1 font-mono pt-2 border-t border-[#181824]">
                          <p className="flex justify-between">
                            <span className="text-slate-400">Tâches ouvertes:</span>
                            <span className="font-bold text-white">{empOpenTasks}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400">Haute priorité:</span>
                            <span className="font-bold text-amber-400">{empUrgentTasks}</span>
                          </p>
                          {emp.phone && (
                            <p className="flex justify-between text-slate-400">
                              <span>Tél:</span>
                              <span>{emp.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/team/${emp.id}`}
                        className="w-full py-2 bg-[#181824] hover:bg-[#202030] text-slate-300 hover:text-white text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-800"
                      >
                        Voir la fiche <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: WORKLOAD */}
      {activeTab === "workload" && (
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#7B61FF]" />
              Charge de Travail par Employé (Workload)
            </h2>

            {employees.length === 0 ? (
              <div className="p-8 text-center bg-[#0A0A10] rounded-xl border border-dashed border-[#1E1E2C] text-slate-400 font-mono text-sm">
                Aucune charge de travail disponible. Enregistrez des employés et assignez des tâches.
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((emp) => {
                  const empTasks = tasks.filter((t) => t.assigned_to === emp.id);
                  const activeTasksCount = empTasks.filter(
                    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
                  ).length;
                  const blockedCount = empTasks.filter((t) => t.status === "BLOCKED").length;

                  return (
                    <div
                      key={emp.id}
                      className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-base">
                            {emp.first_name} {emp.last_name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">({emp.role})</span>
                        </div>
                        <div className="text-xs font-mono text-slate-300">
                          <span className="font-bold text-white">{activeTasksCount}</span> tâches en cours
                        </div>
                      </div>

                      {/* WORKLOAD BAR */}
                      <div className="w-full bg-[#181824] h-3 rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#7B61FF] h-full"
                          style={{
                            width: `${Math.min(100, (activeTasksCount / 10) * 100)}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Statut: {activeTasksCount > 5 ? "Élevé" : "Modéré"}</span>
                        <span>{blockedCount} tâche(s) bloquée(s)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: KANBAN */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["TODO", "IN_PROGRESS", "BLOCKED", "DONE"].map((statusColumn) => {
            const columnTasks = tasks.filter((t) => t.status === statusColumn);

            return (
              <div key={statusColumn} className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-[#181824] pb-3">
                  <span className="font-bold text-sm font-mono text-gray-300 uppercase tracking-wider">
                    {statusColumn === "TODO"
                      ? "À FAIRE"
                      : statusColumn === "IN_PROGRESS"
                      ? "EN COURS"
                      : statusColumn === "BLOCKED"
                      ? "BLOQUÉ"
                      : "TERMINÉ"}
                  </span>
                  <span className="px-2 py-0.5 bg-[#181824] text-xs font-mono rounded text-gray-400">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {columnTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 font-mono border border-dashed border-[#1E1E2C] rounded-xl">
                      Aucune tâche
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const assignee = employees.find((e) => e.id === task.assigned_to);

                      return (
                        <div
                          key={task.id}
                          className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-4 space-y-3 hover:border-[#7B61FF]/40 transition-all"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] ${
                                task.priority === "URGENT"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : task.priority === "HIGH"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-gray-500 text-[9px] font-mono">{task.source}</span>
                          </div>

                          <h4 className="font-medium text-white text-sm">{task.title}</h4>

                          {task.description && (
                            <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                          )}

                          {task.blocker_reason && (
                            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300 font-mono">
                              Motif: {task.blocker_reason}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#181824] font-mono">
                            <span>
                              {assignee
                                ? `${assignee.first_name} ${assignee.last_name?.[0]}.`
                                : "Non assigné"}
                            </span>
                            {task.due_at && (
                              <span>{new Date(task.due_at).toLocaleDateString("fr-FR")}</span>
                            )}
                          </div>

                          {/* ACTION BUTTONS TO MOVE STATUS */}
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-[#181824]">
                            {statusColumn !== "IN_PROGRESS" && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, "IN_PROGRESS")}
                                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-mono rounded border border-blue-500/30 flex items-center gap-1"
                              >
                                <Play className="w-2.5 h-2.5" /> En cours
                              </button>
                            )}
                            {statusColumn !== "DONE" && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, "DONE")}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/30 flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" /> Terminer
                              </button>
                            )}
                            {statusColumn !== "BLOCKED" && (
                              <button
                                onClick={() => {
                                  setSelectedTaskToBlock(task);
                                  setBlockerReasonInput("");
                                  setIsBlockerModalOpen(true);
                                }}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-mono rounded border border-rose-500/30 flex items-center gap-1"
                              >
                                <Ban className="w-2.5 h-2.5" /> Bloquer
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: SCORECARDS */}
      {activeTab === "scorecards" && (
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#7B61FF]" />
              Fiches de Performance & Scorecards
            </h2>

            {employees.length === 0 ? (
              <div className="p-8 text-center bg-[#0A0A10] rounded-xl border border-dashed border-[#1E1E2C] text-slate-400 font-mono text-sm">
                Aucune donnée d&apos;employé disponible.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {employees.map((emp) => {
                  const empTasks = tasks.filter((t) => t.assigned_to === emp.id);
                  const total = empTasks.length;
                  const done = empTasks.filter((t) => t.status === "DONE").length;
                  const overdue = empTasks.filter(
                    (t) =>
                      t.status !== "DONE" &&
                      t.due_at &&
                      new Date(t.due_at).getTime() < Date.now()
                  ).length;

                  let score = 0;
                  let hasEnoughData = total > 0;
                  if (hasEnoughData) {
                    const completionRate = (done / total) * 100;
                    const overdueRate = (overdue / total) * 100;
                    score = Math.max(0, Math.min(100, Math.round(completionRate - overdueRate * 0.5)));
                  }

                  return (
                    <div
                      key={emp.id}
                      className="bg-[#0A0A10] border border-[#1E1E2C] rounded-xl p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white text-lg">
                            {emp.first_name} {emp.last_name}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono">{emp.role}</p>
                        </div>
                        {hasEnoughData ? (
                          <div className="text-right">
                            <span className="text-2xl font-bold text-[#7B61FF] font-mono">{score}</span>
                            <span className="text-xs text-slate-500 font-mono"> / 100</span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold rounded">
                            INSUFFICIENT DATA
                          </span>
                        )}
                      </div>

                      {hasEnoughData ? (
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-[#181824]">
                          <div className="bg-[#12121A] p-2.5 rounded border border-[#1E1E2C]">
                            <p className="text-slate-400">Tâches exécutées</p>
                            <p className="text-base font-bold text-white mt-0.5">{done} / {total}</p>
                          </div>
                          <div className="bg-[#12121A] p-2.5 rounded border border-[#1E1E2C]">
                            <p className="text-slate-400">Tâches en retard</p>
                            <p className="text-base font-bold text-amber-400 mt-0.5">{overdue}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-mono pt-2 border-t border-[#181824]">
                          Aucune tâche attribuée pour évaluer la performance.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ESCALATIONS & BOTTLENECKS */}
      {activeTab === "escalations" && (
        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Escalades & Tâches Bloquées
            </h2>

            {blockedTasks === 0 && overdueTasks === 0 ? (
              <div className="p-8 text-center bg-[#0A0A10] rounded-xl border border-dashed border-[#1E1E2C] text-slate-400 font-mono text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                Aucune escalade ni blocage actif. Tout est en ordre.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === "BLOCKED" || (t.status !== "DONE" && t.due_at && new Date(t.due_at).getTime() < Date.now()))
                  .map((task) => {
                    const assignee = employees.find((e) => e.id === task.assigned_to);

                    return (
                      <div
                        key={task.id}
                        className="bg-[#0A0A10] border border-amber-500/30 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 text-xs font-mono font-bold rounded">
                              {task.status}
                            </span>
                            <h4 className="font-semibold text-white">{task.title}</h4>
                          </div>
                          {task.blocker_reason && (
                            <p className="text-xs text-rose-300 font-mono">Motif: {task.blocker_reason}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400 font-mono">
                          <p>Assigné: {assignee ? `${assignee.first_name} ${assignee.last_name}` : "Non assigné"}</p>
                          {task.due_at && <p>Échéance: {new Date(task.due_at).toLocaleDateString("fr-FR")}</p>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD EMPLOYEE */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#181824] flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#7B61FF]" />
                Enregistrer un Employé
              </h3>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#181824]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              {employeeError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-mono">
                  {employeeError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={empFirstName}
                    onChange={(e) => setEmpFirstName(e.target.value)}
                    placeholder="Jean"
                    required
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={empLastName}
                    onChange={(e) => setEmpLastName(e.target.value)}
                    placeholder="Kaboré"
                    required
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Téléphone *</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="+226 70 00 00 00"
                    required
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Email (optionnel)</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="jean@willshop.bf"
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Poste / Fonction</label>
                  <input
                    type="text"
                    value={empJobTitle}
                    onChange={(e) => setEmpJobTitle(e.target.value)}
                    placeholder="ex: Commercial Terrain"
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Rôle RBAC *</label>
                  <select
                    value={empRole}
                    onChange={(e: any) => setEmpRole(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="COMMERCIAL">COMMERCIAL</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="LIVREUR">LIVREUR</option>
                    <option value="OWNER">OWNER / CEO</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-[#181824] hover:bg-[#202030] text-slate-300 text-xs font-mono rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmployee}
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-mono font-medium rounded-xl transition-all flex items-center gap-2"
                >
                  {isSubmittingEmployee ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                    </>
                  ) : (
                    "Enregistrer l'employé"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#181824] flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#7B61FF]" />
                Créer une Nouvelle Tâche
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#181824]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {taskError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-mono">
                  {taskError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Titre de la tâche *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="ex: Relancer prospect livraison secteur 4"
                  required
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Détails de la mission..."
                  rows={3}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Responsable</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="">Sélectionner un employé</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Priorité</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Date limite (Échéance)</label>
                <input
                  type="date"
                  value={taskDueAt}
                  onChange={(e) => setTaskDueAt(e.target.value)}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-[#181824] hover:bg-[#202030] text-slate-300 text-xs font-mono rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-mono font-medium rounded-xl transition-all flex items-center gap-2"
                >
                  {isSubmittingTask ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Création...
                    </>
                  ) : (
                    "Créer la tâche"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BLOCK TASK REASON */}
      {isBlockerModalOpen && selectedTaskToBlock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#181824] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                Signaler un Blocage
              </h3>
              <button
                onClick={() => setIsBlockerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#181824]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 font-mono">
                Tâche: <span className="font-bold text-white">{selectedTaskToBlock.title}</span>
              </p>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Motif du blocage *
                </label>
                <textarea
                  value={blockerReasonInput}
                  onChange={(e) => setBlockerReasonInput(e.target.value)}
                  placeholder="ex: Client injoignable par téléphone / Stock en rupture"
                  rows={3}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBlockerModalOpen(false)}
                  className="px-4 py-2 bg-[#181824] hover:bg-[#202030] text-slate-300 text-xs font-mono rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateTaskStatus(
                      selectedTaskToBlock.id,
                      "BLOCKED",
                      blockerReasonInput.trim() || "Blocage signalé"
                    );
                    setIsBlockerModalOpen(false);
                  }}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-medium rounded-xl transition-all"
                >
                  Confirmer le blocage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
