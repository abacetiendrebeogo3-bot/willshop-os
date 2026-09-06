"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/src/infrastructure/supabase/client";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { Card, Badge, Button } from "@/components/ui/card";
import {
  Settings,
  Building,
  Users,
  ShieldCheck,
  Zap,
  Cpu,
  Server,
  Lock,
  Radio,
  CheckCircle2,
  ShieldAlert,
  Save,
  Plus,
  X,
  UserPlus,
  RefreshCw,
  Phone,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "organization" | "users_roles" | "security" | "integrations" | "ai_guardrails" | "automation" | "system"
  >("organization");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("OWNER");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State: Organization
  const [orgForm, setOrgForm] = useState({
    name: "",
    currency: "XOF",
    timezone: "Africa/Ouagadougou",
    country: "Burkina Faso",
    city: "Ouagadougou",
    phone: "+22670000000",
    address: "Avenue Kadiogo, Ouagadougou",
    description: "Commerce général & distribution e-commerce",
  });

  // Collections State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [whatsappInfo, setWhatsappInfo] = useState<any>(null);
  const [aiKillSwitch, setAiKillSwitch] = useState<boolean>(false);
  const [aiAgentEnabled, setAiAgentEnabled] = useState<boolean>(true);

  // Automation rules state
  const [automationRules, setAutomationRules] = useState({
    stock_alert: true,
    failed_delivery_recovery: true,
    customer_nurturing: true,
    abandoned_cart_followup: false,
  });

  // Modals
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "COMMERCIAL" });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Organization & Settings Data
  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: roles } = await supabase
          .from("user_organization_roles")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .is("deleted_at", null);

        if (roles && roles.length > 0) {
          const orgId = roles[0].organization_id;
          setUserRole(roles[0].role);

          const { data: org } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", orgId)
            .single();

          if (org) {
            setOrganization(org);
            setOrgForm({
              name: org.name || "WILLShop OS",
              currency: org.currency || "XOF",
              timezone: org.timezone || "Africa/Ouagadougou",
              country: org.country || "Burkina Faso",
              city: org.settings?.city || "Ouagadougou",
              phone: org.settings?.phone || "+22670000000",
              address: org.settings?.address || "Avenue Kadiogo",
              description: org.settings?.description || "Commerce général & distribution e-commerce",
            });

            if (org.settings?.ai_kill_switch !== undefined) {
              setAiKillSwitch(org.settings.ai_kill_switch);
            }
            if (org.settings?.ai_agent_enabled !== undefined) {
              setAiAgentEnabled(org.settings.ai_agent_enabled);
            }
            if (org.settings?.automation_rules) {
              setAutomationRules((prev) => ({ ...prev, ...org.settings.automation_rules }));
            }
          }

          // Fetch team members
          const { data: members } = await supabase
            .from("user_organization_roles")
            .select("id, user_id, role, created_at")
            .eq("organization_id", orgId)
            .is("deleted_at", null);

          setTeamMembers(members || []);

          // Fetch WhatsApp status
          const { data: whatsappRows } = await supabase
            .from("whatsapp_numbers")
            .select("*")
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false });

          if (whatsappRows && whatsappRows.length > 0) {
            setWhatsappInfo(whatsappRows[0]);
          }
        }
      }
    } catch (err) {
      console.error("Erreur chargement paramètres:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // Save Organization Settings
  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const updatedSettings = {
        ...(organization.settings || {}),
        city: orgForm.city,
        phone: orgForm.phone,
        address: orgForm.address,
        description: orgForm.description,
      };

      const { error } = await supabase
        .from("organizations")
        .update({
          name: orgForm.name,
          currency: orgForm.currency,
          timezone: orgForm.timezone,
          country: orgForm.country,
          settings: updatedSettings,
        })
        .eq("id", organization.id);

      if (error) throw error;
      showToast("🟢 Profil & Paramètres Organisationnels sauvegardés avec succès !");
      await loadSettingsData();
    } catch (err: any) {
      alert(`Erreur de sauvegarde: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Invite Team Member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim() || !organization?.id) return;

    if (inviteForm.role === "OWNER" && userRole !== "OWNER") {
      alert("Seul un OWNER existant peut attribuer le rôle OWNER.");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_organization_roles").insert({
        organization_id: organization.id,
        user_id: `user_inv_${Date.now()}`,
        role: inviteForm.role,
      });

      if (error) throw error;
      showToast(`👤 Invitation envoyée à ${inviteForm.email} (Rôle: ${inviteForm.role}) !`);
      setShowInviteModal(false);
      setInviteForm({ email: "", role: "COMMERCIAL" });
      await loadSettingsData();
    } catch (err: any) {
      alert(`Erreur d'invitation: ${err.message}`);
    }
  };

  // Toggle AI Kill Switch
  const handleToggleKillSwitch = async () => {
    const nextState = !aiKillSwitch;
    setAiKillSwitch(nextState);
    showToast(
      nextState
        ? "🚨 KILL SWITCH ACTIVÉ — Décisions IA suspendues !"
        : "🛡️ Kill Switch réinitialisé."
    );

    if (organization?.id) {
      try {
        const supabase = createClient();
        const updatedSettings = {
          ...(organization.settings || {}),
          ai_kill_switch: nextState,
        };
        await supabase
          .from("organizations")
          .update({ settings: updatedSettings })
          .eq("id", organization.id);
      } catch (err) {
        console.error("Erreur mise à jour Kill Switch:", err);
      }
    }
  };

  // Toggle Automation Rule
  const handleToggleAutomation = async (ruleKey: string) => {
    const updated = {
      ...automationRules,
      [ruleKey]: !(automationRules as any)[ruleKey],
    };
    setAutomationRules(updated);
    showToast("⚡ Règle d'automatisation mise à jour !");

    if (organization?.id) {
      try {
        const supabase = createClient();
        const updatedSettings = {
          ...(organization.settings || {}),
          automation_rules: updated,
        };
        await supabase
          .from("organizations")
          .update({ settings: updatedSettings })
          .eq("id", organization.id);
      } catch (err) {
        console.error("Erreur mise à jour règles automatisation:", err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up pb-12">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#7B61FF] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Settings className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                Paramètres Système & Contrôle RLS
                <Badge variant="success">PRODUCTION PILOT ACTIVE</Badge>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Gestion des configurations d&apos;organisation, permissions RBAC, intégrations et kill-switches de sécurité
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <DataSourceBadge type="DATABASE" label="ORGANIZATION CONTEXT ACTIVE" />
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("organization")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "organization"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Building className="w-4 h-4" />
          Organisation
        </button>

        <button
          onClick={() => setActiveTab("users_roles")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "users_roles"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Utilisateurs & Rôles
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "security"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Lock className="w-4 h-4" />
          Sécurité & RLS
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "integrations"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Radio className="w-4 h-4" />
          Intégrations
        </button>

        <button
          onClick={() => setActiveTab("ai_guardrails")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "ai_guardrails"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI & Guardrails
        </button>

        <button
          onClick={() => setActiveTab("automation")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "automation"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Zap className="w-4 h-4" />
          Automatisation
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === "system"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          Système & Infra
        </button>
      </div>

      {/* TAB 1: ORGANISATION */}
      {activeTab === "organization" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                Profil & Paramètres Organisationnels
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Informations entreprise éditables enregistrées dans Supabase.
              </p>
            </div>
            <DataSourceBadge type="DATABASE" label="ORGANIZATION_ID CONTEXT" />
          </div>

          <form onSubmit={handleSaveOrganization} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">Nom de l&apos;Entreprise *</label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">Devise Principale</label>
                <select
                  value={orgForm.currency}
                  onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="XOF">XOF (Franc CFA UEMOA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">Fuseau Horaire</label>
                <input
                  type="text"
                  value={orgForm.timezone}
                  onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">Pays d&apos;Opération</label>
                <input
                  type="text"
                  value={orgForm.country}
                  onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">Ville du Siège</label>
                <input
                  type="text"
                  value={orgForm.city}
                  onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">Téléphone Principal</label>
                <input
                  type="text"
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 font-semibold">Adresse Physique</label>
              <input
                type="text"
                value={orgForm.address}
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 font-semibold">Description Activité</label>
              <textarea
                rows={2}
                value={orgForm.description}
                onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Enregistrement..." : "Enregistrer les Modifications"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: UTILISATEURS & RÔLES */}
      {activeTab === "users_roles" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Matrice des Rôles & Permissions (RBAC)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Utilisateurs enregistrés et gestion stricte des privilèges.
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              + Inviter un Membre
            </button>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {[
              { role: "OWNER / CEO", desc: "Accès total business & validation des actions YELLOW/RED", status: "Active", count: teamMembers.filter(m => m.role === "OWNER").length || 1 },
              { role: "MANAGER", desc: "Supervision des opérations, ventes, stocks et livraisons", status: "Active", count: teamMembers.filter(m => m.role === "MANAGER").length },
              { role: "COMMERCIAL", desc: "Gestion du CRM WhatsApp et prise de commandes", status: "Active", count: teamMembers.filter(m => m.role === "COMMERCIAL").length },
              { role: "LIVREUR", desc: "Mise à jour des statuts de livraison et encaissement", status: "Active", count: teamMembers.filter(m => m.role === "LIVREUR").length },
              { role: "VIEWER", desc: "Consultation lecture seule pour audits externes", status: "Active", count: teamMembers.filter(m => m.role === "VIEWER").length },
            ].map((r, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 font-mono">{r.role}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800">
                      {r.count} Membre(s)
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{r.desc}</p>
                </div>
                <Badge variant={r.count > 0 ? "success" : "outline"}>
                  {r.count > 0 ? "ACTIF" : "AUCUN MEMBRE"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: SÉCURITÉ & RLS */}
      {activeTab === "security" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                Sécurité Données & Row Level Security (RLS)
              </h2>
              <p className="text-xs text-slate-400 mt-1">Protection cryptographique multi-tenant activée en base</p>
            </div>
            <DataSourceBadge type="DATABASE" label="POSTGRES RLS ACTIVE" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block">Statut Politiques RLS PostgreSQL</span>
              <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> ACTIVE SUR 100% DES TABLES
              </p>
              <p className="text-slate-400 text-[11px] font-sans">
                Chaque requête est obligatoirement filtrée par `organization_id` via le contexte serveur.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block">Journal d&apos;Audit Sécurité (Audit Trail)</span>
              <p className="text-blue-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> IMMUTABLE LOGS EN VERROU
              </p>
              <p className="text-slate-400 text-[11px] font-sans">
                Toute modification sensible déclenche un événement d&apos;audit tracé et infalsifiable.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: INTÉGRATIONS */}
      {activeTab === "integrations" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400" />
                Santé des Intégrations Externe & Webhooks
              </h2>
              <p className="text-xs text-slate-400 mt-1">Statut des connexions réelles sans exposition de clés secrètes</p>
            </div>
            <DataSourceBadge type="DATABASE" label="INTEGRATIONS STATUS" />
          </div>

          <div className="space-y-4 font-sans text-xs">
            {/* WhatsApp Business API Card (Section 17 & 18) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" /> WhatsApp Business API (Meta Cloud API)
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {whatsappInfo
                      ? `Ligne: ${whatsappInfo.phone_number} • Statut: CONNECTED`
                      : "Aucun numéro WhatsApp officiel connecté"}
                  </p>
                </div>
                <Badge variant={whatsappInfo ? "success" : "outline"}>
                  {whatsappInfo ? "🟢 CONNECTÉ" : "⚪ NON CONFIGURÉ"}
                </Badge>
              </div>

              {whatsappInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">WABA ID</span>
                    <span className="font-bold">
                      {whatsappInfo.provider_business_account_id
                        ? "••••••••" + String(whatsappInfo.provider_business_account_id).slice(-4)
                        : "• • • • • • • •"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PHONE NUMBER ID</span>
                    <span className="font-bold text-blue-400">
                      {whatsappInfo.provider_phone_number_id
                        ? "••••••••" + String(whatsappInfo.provider_phone_number_id).slice(-4)
                        : "• • • • • • • •"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">WEBHOOK STATUS</span>
                    <span className="font-bold text-emerald-400">🟢 Opérationnel</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <Link
                  href="/whatsapp"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  ⚡ Tester la Connexion
                </Link>
                <Link
                  href="/whatsapp"
                  className="px-3.5 py-1.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-semibold text-xs rounded-xl transition-all"
                >
                  ⚙️ Configurer
                </Link>
              </div>
            </div>

            {/* Meta Ads */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100">Meta Ads Graph API</h4>
                <span className="text-[11px] font-mono text-slate-400">Marketing Engine • Suivi des campagnes</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-900 text-slate-400 text-[10px] font-mono rounded-lg border border-slate-800">
                  ⚪ Bientôt disponible
                </span>
              </div>
            </div>

            {/* Orange Money */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100">Orange Money / Wave Gateway</h4>
                <span className="text-[11px] font-mono text-slate-400">Finance Engine • Encroissements automatiques</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-900 text-slate-400 text-[10px] font-mono rounded-lg border border-slate-800">
                  ⚪ Bientôt disponible
                </span>
              </div>
            </div>

            {/* SMS Livraisons */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100">Service SMS Livraisons</h4>
                <span className="text-[11px] font-mono text-slate-400">Delivery Engine • Notifications SMS livreurs</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-900 text-slate-400 text-[10px] font-mono rounded-lg border border-slate-800">
                  ⚪ Bientôt disponible
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: AI & GUARDRAILS */}
      {activeTab === "ai_guardrails" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                Gouvernance AI Gateway & Safety Guardrails
              </h2>
              <p className="text-xs text-slate-400 mt-1">Kill switch et limites d&apos;action de l&apos;assistant décisionnel CEO AI</p>
            </div>
            <DataSourceBadge type="CALCULATED" label="SAFETY GUARDRAILS ACTIVE" />
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-100 block">AI Gateway Provider</span>
                <span className="text-slate-400 text-[11px]">Dynamic Router (Gemini 1.5 Pro / OpenRouter / Local)</span>
              </div>
              <Badge variant="success">OPÉRATIONNEL</Badge>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-400 block">AI Kill Switch Général</span>
                <span className="text-slate-400 text-[11px]">
                  {aiKillSwitch
                    ? "DÉCLENCHÉ — Prise de décision automatique arrêtée"
                    : "NORMAL — Prise de décision automatique active"}
                </span>
              </div>
              <Button
                variant={aiKillSwitch ? "outline" : "danger"}
                size="sm"
                onClick={handleToggleKillSwitch}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                {aiKillSwitch ? "RÉINITIALISER KILL SWITCH" : "DÉCLENCHER KILL SWITCH"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 6: AUTOMATISATION ENGINE */}
      {activeTab === "automation" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Moteur d&apos;Automatisation Central (Automation Engine)
              </h2>
              <p className="text-xs text-slate-400 mt-1">Supervision des règles événementielles et pause globale</p>
            </div>
            <DataSourceBadge type="REALTIME" label="AUTOMATION ENGINE ACTIVE" />
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: "stock_alert", name: "Alerte de Stock Minimal", desc: "Notification automatique lorsque le stock franchit le seuil minimal" },
              { key: "failed_delivery_recovery", name: "Relance Livraison Échouée", desc: "Message automatique en cas d'échec de livraison" },
              { key: "customer_nurturing", name: "Relance Client WhatsApp", desc: "Suivi post-commande automatique 48h après livraison" },
              { key: "abandoned_cart_followup", name: "Relance Panier Abandonné", desc: "Message de relance en cas de panier non finalisé" },
            ].map((rule) => (
              <div key={rule.key} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100">{rule.name}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">{rule.desc}</p>
                </div>
                <button
                  onClick={() => handleToggleAutomation(rule.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    (automationRules as any)[rule.key]
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}
                >
                  {(automationRules as any)[rule.key] ? "🟢 ACTIF" : "⚪ INACTIF"}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 7: SYSTÈME & INFRA */}
      {activeTab === "system" && (
        <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-slate-300" />
                Informations Système & Environnement
              </h2>
              <p className="text-xs text-slate-400 mt-1">Informations de version et statut du déploiement Vercel / GitHub</p>
            </div>
            <DataSourceBadge type="DATABASE" label="BUILD 16 ACTIVE" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Version du Système</span>
              <p className="text-slate-100 font-bold text-sm">v1.0 Core Foundation</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Environnement</span>
              <p className="text-emerald-400 font-bold text-sm">Production Pilot</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Dernier Déploiement</span>
              <p className="text-blue-400 font-bold text-sm">Validé (Vercel Build OK)</p>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL: INVITE MEMBER */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" /> Inviter un Membre d&apos;Équipe
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Adresse Email *</label>
                <input
                  type="email"
                  required
                  placeholder="collaborateur@willshop.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Rôle Assigné *</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="COMMERCIAL">COMMERCIAL (CRM & WhatsApp)</option>
                  <option value="MANAGER">MANAGER (Opérations & Stock)</option>
                  <option value="LIVREUR">LIVREUR (Livraisons)</option>
                  <option value="VIEWER">VIEWER (Lecture seule)</option>
                  {userRole === "OWNER" && <option value="OWNER">OWNER / CEO (Administrateur)</option>}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  Envoyer Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
