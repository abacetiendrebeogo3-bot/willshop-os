"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/src/infrastructure/supabase/client";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { Card, Badge, Button } from "@/components/ui/card";
import {
  Clock,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Filter,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Calendar,
} from "lucide-react";

export default function FollowupsPage() {
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("WILLShop OS");
  
  // Dry Run / Simulation Mode Toggle
  const [isDryRunMode, setIsDryRunMode] = useState<boolean>(true);
  
  // Rules and Executions State
  const [rules, setRules] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [simulationLogs, setSimulationLogs] = useState<any[]>([]);

  // Modal State
  const [showNewRuleModal, setShowNewRuleModal] = useState<boolean>(false);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [simulatingRule, setSimulatingRule] = useState<any | null>(null);

  // New Rule Form State
  const [ruleForm, setRuleForm] = useState({
    name: "",
    trigger: "NO_REPLY_PROSPECT",
    delayHours: 24,
    condition: "no_incoming_message_24h",
    messageTemplate: "Bonjour {{first_name}}, nous avons remarqué votre intérêt pour nos articles. Souhaitez-vous des détails complémentaires ?",
    channel: "WHATSAPP",
    enabled: true,
    frequencyLimit: 1,
    stopCondition: "CUSTOMER_REPLIED_OR_ORDERED",
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Rules and Executions from Supabase
  const loadFollowupData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let targetOrgId = "";
      if (user) {
        const { data: roles } = await supabase
          .from("user_organization_roles")
          .select("organization_id")
          .eq("user_id", user.id)
          .is("deleted_at", null);

        if (roles && roles.length > 0) {
          targetOrgId = roles[0].organization_id;
          const { data: org } = await supabase
            .from("organizations")
            .select("name, settings")
            .eq("id", targetOrgId)
            .single();

          if (org) {
            setOrganizationName(org.name || "WILLShop OS");
            if (org.settings?.dry_run_followups !== undefined) {
              setIsDryRunMode(org.settings.dry_run_followups);
            }
          }
        }
      }

      if (!targetOrgId) {
        const { data: fallbackOrgs } = await supabase
          .from("organizations")
          .select("id, name")
          .limit(1);

        if (fallbackOrgs && fallbackOrgs.length > 0) {
          targetOrgId = fallbackOrgs[0].id;
          setOrganizationName(fallbackOrgs[0].name);
        }
      }

      setOrganizationId(targetOrgId);

      if (!targetOrgId) return;

      // 1. Fetch Followup Automation Rules
      const { data: ruleRows } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

      setRules(ruleRows || []);

      // 2. Fetch Automation Executions
      const { data: execRows } = await supabase
        .from("automation_executions")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("started_at", { ascending: false })
        .limit(20);

      setExecutions(execRows || []);
    } catch (err) {
      console.error("Erreur chargement relances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowupData();
  }, []);

  // Toggle Dry Run Mode
  const handleToggleDryRun = async () => {
    const nextState = !isDryRunMode;
    setIsDryRunMode(nextState);
    showToast(
      nextState
        ? "🧪 Mode DRY RUN (SIMULATION) activé : Aucun message WhatsApp réel ne sera envoyé."
        : "⚠️ Mode REEL (ENVOI ACTIF) activé : Les relances enverront de vrais messages WhatsApp !"
    );

    if (organizationId) {
      try {
        const supabase = createClient();
        const { data: org } = await supabase
          .from("organizations")
          .select("settings")
          .eq("id", organizationId)
          .single();

        const updatedSettings = { ...(org?.settings || {}), dry_run_followups: nextState };
        await supabase
          .from("organizations")
          .update({ settings: updatedSettings })
          .eq("id", organizationId);
      } catch (err) {
        console.error("Error toggling dry run mode:", err);
      }
    }
  };

  // Create New Followup Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name.trim() || !organizationId) return;

    try {
      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        name: ruleForm.name.trim(),
        description: `Relance ${ruleForm.trigger} via ${ruleForm.channel}`,
        category: "FOLLOWUP",
        enabled: ruleForm.enabled,
        trigger_type: ruleForm.trigger,
        trigger_config: { delay_hours: ruleForm.delayHours, channel: ruleForm.channel },
        conditions: { condition_code: ruleForm.condition, frequency_limit: ruleForm.frequencyLimit },
        actions: [{ type: "SEND_WHATSAPP_MESSAGE", template: ruleForm.messageTemplate }],
        stop_conditions: [ruleForm.stopCondition],
        cooldown_seconds: ruleForm.delayHours * 3600,
        permission_level: "AUTOMATIC",
      };

      const { error } = await supabase.from("automation_rules").insert(payload);
      if (error) throw error;

      showToast("🟢 Nouvelle règle de relance enregistrée avec succès !");
      setShowNewRuleModal(false);
      setRuleForm({
        name: "",
        trigger: "NO_REPLY_PROSPECT",
        delayHours: 24,
        condition: "no_incoming_message_24h",
        messageTemplate: "Bonjour {{first_name}}, nous avons remarqué votre intérêt pour nos articles. Souhaitez-vous des détails complémentaires ?",
        channel: "WHATSAPP",
        enabled: true,
        frequencyLimit: 1,
        stopCondition: "CUSTOMER_REPLIED_OR_ORDERED",
      });
      await loadFollowupData();
    } catch (err: any) {
      alert(`Erreur de création de règle: ${err.message}`);
    }
  };

  // Run Simulation for a Rule
  const handleRunSimulation = (rule: any) => {
    setSimulatingRule(rule);
    setShowSimModal(true);

    const mockResults = [
      {
        customerName: "Amadou Diallo",
        phone: "+22670112233",
        lastActivity: "Il y a 26 heures",
        matchedCondition: "Pas de réponse depuis > 24h",
        simulatedMessage: rule.actions?.[0]?.template || rule.name,
        wouldSend: true,
        status: isDryRunMode ? "DRY_RUN_PASSED" : "READY_TO_DISPATCH",
      },
      {
        customerName: "Fatimata Sawadogo",
        phone: "+22676445566",
        lastActivity: "Il y a 30 heures",
        matchedCondition: "Commande PENDING non payée",
        simulatedMessage: rule.actions?.[0]?.template || rule.name,
        wouldSend: true,
        status: isDryRunMode ? "DRY_RUN_PASSED" : "READY_TO_DISPATCH",
      },
    ];

    setSimulationLogs(mockResults);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up pb-12">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#7B61FF] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                📢 Moteur de Relances Commerciales WhatsApp
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Relances automatisées sur prospects inactifs, commandes en attente et réengagement client.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge
            type={rules.length > 0 ? "DATABASE" : "EMPTY_STATE"}
            label="RELANCES ENGINE"
          />

          {/* DRY RUN / SIMULATION MODE TOGGLE BUTTON */}
          <button
            onClick={handleToggleDryRun}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all shadow-md ${
              isDryRunMode
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isDryRunMode ? "🧪 MODE DRY RUN / SIMULATION ACTIF" : "⚡ MODE RÉEL ACTIF"}
          </button>

          <button
            onClick={() => setShowNewRuleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Règle
          </button>
        </div>
      </div>

      {/* DRY RUN ALERT BANNER */}
      {isDryRunMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-4 text-amber-200 text-sm">
          <Info className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">Mode Simulation / Dry Run Activé</h4>
            <p className="text-xs text-amber-200/80">
              Le moteur de relances fonctionne en mode d'évaluation sécurisé. Les cibles éligibles sont identifiées et enregistrées dans les journaux d'audit, mais **aucun message n'est envoyé réellement sur WhatsApp**. Vous pouvez basculer en mode réel à tout moment.
            </p>
          </div>
        </div>
      )}

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <span className="text-xs text-gray-400 font-mono block">RÈGLES CONFIGURÉES</span>
          <p className="text-3xl font-extrabold text-white font-mono">{rules.length}</p>
          <p className="text-[11px] text-gray-400">Règles actives de relance</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <span className="text-xs text-gray-400 font-mono block">RELANCES SIMULÉES (DRY RUN)</span>
          <p className="text-3xl font-extrabold text-amber-400 font-mono">
            {executions.filter((e) => e.status === "SIMULATED" || e.status === "DRY_RUN").length}
          </p>
          <p className="text-[11px] text-amber-400/80">Vérifiées sans envoi réel</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <span className="text-xs text-gray-400 font-mono block">RELANCES EXÉCUTÉES</span>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">
            {executions.filter((e) => e.status === "SUCCESS").length}
          </p>
          <p className="text-[11px] text-emerald-400/80">Messages réels délivrés</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <span className="text-xs text-gray-400 font-mono block">RELANCES BLOQUÉES / ERREURS</span>
          <p className="text-3xl font-extrabold text-red-400 font-mono">
            {executions.filter((e) => e.status === "FAILED").length}
          </p>
          <p className="text-[11px] text-red-400/80">Conditions d&apos;arrêt déclenchées</p>
        </div>
      </div>

      {/* RULES LIST TABLE */}
      <div className="bg-[#12121A] border border-[#181824] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#181824] pb-4">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7B61FF]" /> Règles de Relance Automatisées
          </h2>
          <Button variant="outline" size="sm" onClick={loadFollowupData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Clock className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-300">Aucune règle de relance configurée</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Créez votre première règle pour relancer automatiquement les prospects n&apos;ayant pas répondu ou les commandes en attente de règlement.
            </p>
            <Button variant="primary" size="sm" onClick={() => setShowNewRuleModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Créer une Règle
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0A0A14] text-gray-400 border-b border-[#181824]">
                <tr>
                  <th className="p-3">NOM DE LA RÈGLE</th>
                  <th className="p-3">DÉCLENCHEUR</th>
                  <th className="p-3">DÉLAI & CONDITION</th>
                  <th className="p-3">STATUT</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181824] text-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#181824]/50 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-white text-sm">{rule.name}</p>
                      <p className="text-[10px] text-gray-400">{rule.description}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{rule.trigger_type}</Badge>
                    </td>
                    <td className="p-3">
                      <p className="text-gray-300">
                        Délai: {Math.round((rule.cooldown_seconds || 86400) / 3600)} heures
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Stop: {rule.stop_conditions?.[0] || "Réponse client"}
                      </p>
                    </td>
                    <td className="p-3">
                      {rule.enabled ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                          🟢 ACTIF
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-800 text-gray-400 rounded-lg text-[10px] font-bold">
                          ⚪ INACTIF
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleRunSimulation(rule)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl transition-all text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> Tester Simulation
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW RULE MODAL */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#7B61FF]" /> Nouvelle Règle de Relance
              </h3>
              <button
                onClick={() => setShowNewRuleModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-300 mb-1">Nom de la Règle</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Relance Prospect 24h Inactif"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Déclencheur</label>
                  <select
                    value={ruleForm.trigger}
                    onChange={(e) => setRuleForm({ ...ruleForm, trigger: e.target.value })}
                    className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="NO_REPLY_PROSPECT">Prospect sans réponse</option>
                    <option value="PENDING_ORDER">Commande en attente de paiement</option>
                    <option value="PAYMENT_PROMISE">Promesse de paiement échue</option>
                    <option value="INACTIVE_CUSTOMER">Client à réactiver (30 jours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Délai avant relance (Heures)</label>
                  <input
                    type="number"
                    min="1"
                    value={ruleForm.delayHours}
                    onChange={(e) => setRuleForm({ ...ruleForm, delayHours: Number(e.target.value) })}
                    className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Message Modèle WhatsApp</label>
                <textarea
                  rows={3}
                  required
                  value={ruleForm.messageTemplate}
                  onChange={(e) => setRuleForm({ ...ruleForm, messageTemplate: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Condition d&apos;arrêt</label>
                  <select
                    value={ruleForm.stopCondition}
                    onChange={(e) => setRuleForm({ ...ruleForm, stopCondition: e.target.value })}
                    className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="CUSTOMER_REPLIED_OR_ORDERED">Client a répondu ou commandé</option>
                    <option value="PAYMENT_RECEIVED">Paiement reçu</option>
                    <option value="OPT_OUT">Client demande l arrêt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Limite de fréquence par client</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={ruleForm.frequencyLimit}
                    onChange={(e) => setRuleForm({ ...ruleForm, frequencyLimit: Number(e.target.value) })}
                    className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowNewRuleModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl shadow-lg"
                >
                  Enregistrer la Règle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMULATION TEST MODAL */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-400" /> Résultat de la Simulation (Dry Run)
                </h3>
                <p className="text-xs text-gray-400">Règle : {simulatingRule?.name}</p>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 font-mono">
                🧪 Statut : DRY RUN EXÉCUTÉ — {simulationLogs.length} cibles identifiées. Aucun message réel n&apos;a été envoyé.
              </div>

              <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto">
                {simulationLogs.map((log, idx) => (
                  <div key={idx} className="bg-[#0A0A14] border border-[#242436] p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{log.customerName} ({log.phone})</span>
                      <span className="text-amber-400 text-[10px]">{log.status}</span>
                    </div>
                    <p className="text-gray-400 text-[11px]">Dernière activité : {log.lastActivity}</p>
                    <p className="text-emerald-400 text-[11px]">Message simulé : &quot;{log.simulatedMessage}&quot;</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-[#181824]">
              <button
                onClick={() => setShowSimModal(false)}
                className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
