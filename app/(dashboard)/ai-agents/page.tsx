"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/src/infrastructure/supabase/client";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { Card } from "@/components/ui/card";
import {
  Bot,
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Globe,
  MessageSquare,
  Package,
  Users,
  Search,
  Filter,
  CheckSquare,
  Lock,
  RefreshCw,
  Loader2,
  X,
  Sliders,
  Radio,
  FileText,
  DollarSign,
  UserCheck,
  Send,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: "ENTREPRISE" | "LIVRAISON" | "PAIEMENT" | "FAQ" | "POLITIQUES" | "AUTRES";
  content: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

export default function AIAgentsConfigPage() {
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("WILLShop OS");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Real Metrics from Database
  const [metrics, setMetrics] = useState({
    activeConversations: 0,
    customersCount: 0,
    escalationsCount: 0,
    productsCount: 0,
  });

  // Global AI Status
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);

  // Agent Config State (Section 1: Identité & Comportement)
  const [identityConfig, setIdentityConfig] = useState({
    name: "Sales AI WILLShop",
    presentation: "Assistant commercial virtuel disponible 24/7 pour conseiller et accompagner vos clients.",
    tone: "Professionnel & Chaleureux",
    language: "Français",
    style: "Concis (1-2 phrases)",
    customInstructions: "Accueillir chaleureusement les clients en français. Être poli et donner des informations précises sur nos produits.",
  });

  // Section 2: Knowledge Base State
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>([
    {
      id: "kb-default-1",
      title: "Zones & Frais de livraison",
      category: "LIVRAISON",
      content: "Livraison à Ouagadougou: 1000 FCFA (24h). Bobo-Dioulasso: 1500 FCFA. Autres villes: Expédition par compagnie de transport.",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
    {
      id: "kb-default-2",
      title: "Modes de Paiement Acceptés",
      category: "PAIEMENT",
      content: "Paiement à la livraison en espèces. Orange Money et Wave acceptés après confirmation du numéro commercial.",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState<string>("ALL");
  const [showKnowledgeModal, setShowKnowledgeModal] = useState<boolean>(false);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeEntry | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState<{
    title: string;
    category: KnowledgeEntry["category"];
    content: string;
  }>({
    title: "",
    category: "FAQ",
    content: "",
  });

  // Section 3: Tools & Capabilities State (Real Tools Checkboxes)
  const [toolsConfig, setToolsConfig] = useState<Record<string, boolean>>({
    search_products: true,
    check_price: true,
    check_stock: true,
    check_zones: true,
    lookup_customer: true,
    lookup_orders: true,
    lookup_delivery: true,
    send_product_card: true,
    create_order: true,
    update_crm: true,
    escalate_human: true,
  });

  // Section 6: Schedule & Availability State
  const [scheduleConfig, setScheduleConfig] = useState({
    active: false,
    mode: "24/7",
    startTime: "08:00",
    endTime: "20:00",
    timezone: "Africa/Ouagadougou",
  });

  // Test Modal State
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testInputMessage, setTestInputMessage] = useState<string>("Bonjour, quel est le prix du Baume Vibe et livrez-vous à Ouagadougou ?");
  const [isExecutingTest, setIsExecutingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    responseText?: string;
    triggerHandoff?: boolean;
    confidence?: number;
    error?: string;
    latencyMs?: number;
  } | null>(null);

  // Accordions open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true,
    knowledge: true,
    catalog: true,
    tools: true,
    guardrails: true,
    human: true,
    schedule: true,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Real Data from Supabase
  const loadConfigData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: userRoles } = await supabase
        .from("user_organization_roles")
        .select("organization_id")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      const targetOrgId = userRoles?.[0]?.organization_id;
      if (!targetOrgId) return;

      setOrganizationId(targetOrgId);

      // Fetch Organization details & settings
      const { data: org } = await supabase
        .from("organizations")
        .select("name, settings")
        .eq("id", targetOrgId)
        .single();

      if (org) {
        setOrganizationName(org.name);
        const settings = org.settings || {};
        setAiEnabled(settings.ai_agent_enabled ?? true);

        const aiConfig = settings.ai_agent_config || {};
        if (aiConfig.name) {
          setIdentityConfig({
            name: aiConfig.name || "Sales AI WILLShop",
            presentation: aiConfig.presentation || "",
            tone: aiConfig.tone || "Professionnel & Chaleureux",
            language: aiConfig.language || "Français",
            style: aiConfig.style || "Concis (1-2 phrases)",
            customInstructions: aiConfig.custom_instructions || "",
          });
        }

        if (aiConfig.knowledge_base && Array.isArray(aiConfig.knowledge_base)) {
          setKnowledgeBase(aiConfig.knowledge_base);
        }

        if (aiConfig.tools) {
          setToolsConfig((prev) => ({ ...prev, ...aiConfig.tools }));
        }

        if (aiConfig.schedule) {
          setScheduleConfig((prev) => ({ ...prev, ...aiConfig.schedule }));
        }
      }

      // Fetch Real Metrics from Database
      const [{ count: convCount }, { count: custCount }, { count: handoffCount }, { count: prodCount }] =
        await Promise.all([
          supabase.from("conversations").select("*", { count: "exact", head: true }).eq("organization_id", targetOrgId).neq("status", "ARCHIVED"),
          supabase.from("customers").select("*", { count: "exact", head: true }).eq("organization_id", targetOrgId),
          supabase.from("human_handoffs").select("*", { count: "exact", head: true }).eq("organization_id", targetOrgId).eq("status", "PENDING"),
          supabase.from("products").select("*", { count: "exact", head: true }).eq("organization_id", targetOrgId).eq("status", "ACTIVE"),
        ]);

      setMetrics({
        activeConversations: convCount || 0,
        customersCount: custCount || 0,
        escalationsCount: handoffCount || 0,
        productsCount: prodCount || 0,
      });
    } catch (err) {
      console.error("Erreur chargement config Agent IA:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigData();
  }, []);

  // Save Settings to Supabase Database
  const handleSaveConfig = async () => {
    if (!organizationId) return;
    setIsSaving(true);
    try {
      const supabase = createClient();

      const { data: currentOrg } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", organizationId)
        .single();

      const existingSettings = currentOrg?.settings || {};

      const updatedSettings = {
        ...existingSettings,
        ai_agent_enabled: aiEnabled,
        ai_agent_config: {
          ...(existingSettings.ai_agent_config || {}),
          name: identityConfig.name,
          presentation: identityConfig.presentation,
          tone: identityConfig.tone,
          language: identityConfig.language,
          style: identityConfig.style,
          custom_instructions: identityConfig.customInstructions,
          enabled: aiEnabled,
          knowledge_base: knowledgeBase,
          tools: toolsConfig,
          schedule: scheduleConfig,
          updated_at: new Date().toISOString(),
        },
      };

      const { error } = await supabase
        .from("organizations")
        .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
        .eq("id", organizationId);

      if (error) throw error;

      showToast("✓ Configuration de l'Agent IA enregistrée avec succès !");
    } catch (err: any) {
      alert(`Erreur enregistrement : ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Save or Add Knowledge Entry
  const handleSaveKnowledgeEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) return;

    if (editingKnowledge) {
      setKnowledgeBase((prev) =>
        prev.map((k) =>
          k.id === editingKnowledge.id
            ? { ...k, title: knowledgeForm.title, category: knowledgeForm.category, content: knowledgeForm.content }
            : k
        )
      );
      showToast("✓ Connaissance modifiée");
    } else {
      const newEntry: KnowledgeEntry = {
        id: `kb-${Date.now()}`,
        title: knowledgeForm.title.trim(),
        category: knowledgeForm.category,
        content: knowledgeForm.content.trim(),
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
      setKnowledgeBase((prev) => [newEntry, ...prev]);
      showToast("✓ Nouvelle connaissance ajoutée");
    }

    setShowKnowledgeModal(false);
    setEditingKnowledge(null);
    setKnowledgeForm({ title: "", category: "FAQ", content: "" });
  };

  // Delete Knowledge Entry
  const handleDeleteKnowledge = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette connaissance ?")) return;
    setKnowledgeBase((prev) => prev.filter((k) => k.id !== id));
    showToast("🗑️ Connaissance supprimée");
  };

  // Run Real Anthropic Agent Test
  const handleRunAgentTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testInputMessage.trim()) return;

    setIsExecutingTest(true);
    setTestResult(null);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/whatsapp/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: testInputMessage.trim() }),
      });

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (!res.ok || data.error) {
        setTestResult({
          success: false,
          error: data.error || "Échec de l'exécution du test IA",
          latencyMs,
        });
        return;
      }

      setTestResult({
        success: true,
        responseText: data.responseText,
        triggerHandoff: data.triggerHandoff,
        confidence: data.confidence,
        latencyMs,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Erreur réseau lors du test IA",
        latencyMs: Date.now() - startTime,
      });
    } finally {
      setIsExecutingTest(false);
    }
  };

  const filteredKnowledge = knowledgeBase.filter((k) => {
    if (knowledgeCategoryFilter === "ALL") return true;
    return k.category === knowledgeCategoryFilter;
  });

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
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#7B61FF]/10 rounded-2xl border border-[#7B61FF]/20 text-[#7B61FF]">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                🤖 Agent IA Commercial
              </h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-mono font-bold border ${
                  aiEnabled
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}
              >
                {aiEnabled ? "🟢 Actif (Global)" : "🔴 Inactif (Global)"}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Centre de configuration du comportement, des connaissances métiers et des outils temps réel de votre assistant.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#181824] hover:bg-[#222232] text-white border border-[#282838] rounded-xl font-medium transition-all text-sm shadow-md"
          >
            <Play className="w-4 h-4 text-[#7B61FF]" />
            🧪 Tester l'Agent IA
          </button>

          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
              aiEnabled
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
          >
            <Zap className="w-4 h-4" />
            {aiEnabled ? "Désactiver l'IA" : "Activer l'IA"}
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* METRICS BAR (Real Database Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">DISCUSSIONS ACTIVES</span>
          <span className="font-bold text-white text-base">{metrics.activeConversations}</span>
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">CLIENTS ENREGISTRÉS</span>
          <span className="font-bold text-emerald-400 text-base">{metrics.customersCount}</span>
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">ESCALADES HUMAINES</span>
          <span className="font-bold text-amber-400 text-base">{metrics.escalationsCount}</span>
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">PRODUITS CATALOGUE</span>
          <span className="font-bold text-blue-400 text-base">{metrics.productsCount} accessibles</span>
        </div>
      </div>

      {/* 6 CONFIGURATION SECTIONS */}
      <div className="space-y-4">
        {/* SECTION 1: IDENTITÉ & COMPORTEMENT */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection("identity")}
            className="w-full p-5 flex items-center justify-between bg-[#14141E] border-b border-[#181824] hover:bg-[#181828] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-[#7B61FF]" />
              <div>
                <h3 className="font-bold text-white text-base">1. Identité & Comportement de l'Agent</h3>
                <p className="text-xs text-gray-400">Nom, ton de voix, style de réponse et instructions personnalisées</p>
              </div>
            </div>
            {openSections.identity ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {openSections.identity && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Nom de l'Agent IA</label>
                  <input
                    type="text"
                    value={identityConfig.name}
                    onChange={(e) => setIdentityConfig({ ...identityConfig, name: e.target.value })}
                    className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Ton de Voix</label>
                  <select
                    value={identityConfig.tone}
                    onChange={(e) => setIdentityConfig({ ...identityConfig, tone: e.target.value })}
                    className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                  >
                    <option value="Professionnel & Chaleureux">Professionnel & Chaleureux (Recommandé)</option>
                    <option value="Enthousiaste & Dynamique">Enthousiaste & Dynamique</option>
                    <option value="Formel & Courtois">Formel & Courtois</option>
                    <option value="Direct & Concis">Direct & Concis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Présentation courte</label>
                <input
                  type="text"
                  value={identityConfig.presentation}
                  onChange={(e) => setIdentityConfig({ ...identityConfig, presentation: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Langue Principale</label>
                  <select
                    value={identityConfig.language}
                    onChange={(e) => setIdentityConfig({ ...identityConfig, language: e.target.value })}
                    className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                  >
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Mooré">Mooré (Burkina Faso)</option>
                    <option value="Dioula">Dioula</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Style de Réponse</label>
                  <select
                    value={identityConfig.style}
                    onChange={(e) => setIdentityConfig({ ...identityConfig, style: e.target.value })}
                    className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                  >
                    <option value="Concis (1-2 phrases)">Concis (1-2 phrases pour WhatsApp)</option>
                    <option value="Détaillé & Explicatif">Détaillé & Explicatif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Instructions Personnalisées (Directives Métier)
                </label>
                <textarea
                  rows={3}
                  value={identityConfig.customInstructions}
                  onChange={(e) => setIdentityConfig({ ...identityConfig, customInstructions: e.target.value })}
                  placeholder="Ex: Toujours demander la ville de livraison avant de confirmer le prix..."
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none font-sans"
                />
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3 text-[#7B61FF]" />
                  Les garde-fous fondamentaux et la sécurité restent toujours appliqués par le système.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: BASE DE CONNAISSANCES (VRAIE FONCTIONNALITÉ CRUD) */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection("knowledge")}
            className="w-full p-5 flex items-center justify-between bg-[#14141E] border-b border-[#181824] hover:bg-[#181828] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-white text-base">2. Base de Connaissances Métier (CRUD)</h3>
                <p className="text-xs text-gray-400">Informations stables sur votre entreprise, livraisons, paiements et FAQ</p>
              </div>
            </div>
            {openSections.knowledge ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {openSections.knowledge && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#181824] pb-4">
                <div className="flex items-center gap-1 overflow-x-auto font-mono text-xs">
                  {["ALL", "ENTREPRISE", "LIVRAISON", "PAIEMENT", "FAQ", "POLITIQUES"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setKnowledgeCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        knowledgeCategoryFilter === cat
                          ? "bg-[#7B61FF] text-white font-bold"
                          : "bg-[#181824] text-gray-400 hover:text-white"
                      }`}
                    >
                      {cat === "ALL" ? "Toutes" : cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setEditingKnowledge(null);
                    setKnowledgeForm({ title: "", category: "FAQ", content: "" });
                    setShowKnowledgeModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-semibold rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une Connaissance
                </button>
              </div>

              {/* KNOWLEDGE LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredKnowledge.map((k) => (
                  <div key={k.id} className="bg-[#181824] border border-[#282838] p-4 rounded-xl space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{k.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30">
                        {k.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap">{k.content}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(k.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingKnowledge(k);
                            setKnowledgeForm({ title: k.title, category: k.category, content: k.content });
                            setShowKnowledgeModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Éditer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKnowledge(k.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: CATALOGUE (DONNÉES TEMPS RÉEL) */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">📦 Catalogue Produits (Données Temps Réel)</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="font-bold text-emerald-400">{metrics.productsCount} produits</span> accessibles automatiquement par l'Agent via les outils système.
              </p>
            </div>
          </div>

          <Link
            href="/operations/products"
            className="px-4 py-2 bg-[#181824] hover:bg-[#222232] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
          >
            Voir les produits dans le Catalogue
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* SECTION 4: CAPACITÉS & OUTILS (TOOLS RÉELS) */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection("tools")}
            className="w-full p-5 flex items-center justify-between bg-[#14141E] border-b border-[#181824] hover:bg-[#181828] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-base">3. Capacités & Outils Temps Réel (Tools)</h3>
                <p className="text-xs text-gray-400">Activez ou désactivez les outils autorisés pour l'Agent IA</p>
              </div>
            </div>
            {openSections.tools ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {openSections.tools && (
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3 font-mono">
                  CONSULTER (Lecture Temps Réel)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { key: "search_products", label: "Rechercher des produits", desc: "Consultation catalogue SSOT" },
                    { key: "check_price", label: "Vérifier prix & promotions", desc: "Consultation tarifs" },
                    { key: "check_stock", label: "Vérifier le stock disponible", desc: "Vérification inventaire" },
                    { key: "check_zones", label: "Vérifier zones de livraison", desc: "Frais & zones" },
                    { key: "lookup_customer", label: "Consulter profil client CRM", desc: "Historique & préférences" },
                    { key: "lookup_orders", label: "Consulter les commandes", desc: "Statut des commandes" },
                    { key: "lookup_delivery", label: "Consulter statut livraison", desc: "Suivi des livreurs" },
                  ].map((t) => (
                    <label key={t.key} className="bg-[#181824] border border-[#282838] p-3 rounded-xl flex items-start gap-3 cursor-pointer hover:border-[#7B61FF]/40 transition-all">
                      <input
                        type="checkbox"
                        checked={toolsConfig[t.key] ?? true}
                        onChange={(e) => setToolsConfig({ ...toolsConfig, [t.key]: e.target.checked })}
                        className="mt-0.5 accent-[#7B61FF]"
                      />
                      <div>
                        <span className="font-semibold text-white block">{t.label}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{t.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3 font-mono">
                  AGIR (Actions & Mises à jour)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { key: "send_product_card", label: "Envoyer fiches produits", desc: "Photos, prix & fiches" },
                    { key: "create_order", label: "Créer une commande client", desc: "Enregistrement vente" },
                    { key: "update_crm", label: "Mettre à jour le profil CRM", desc: "Mise à jour coordonnées" },
                    { key: "escalate_human", label: "Escalader vers un humain", desc: "Transfert conseiller" },
                  ].map((t) => (
                    <label key={t.key} className="bg-[#181824] border border-[#282838] p-3 rounded-xl flex items-start gap-3 cursor-pointer hover:border-[#7B61FF]/40 transition-all">
                      <input
                        type="checkbox"
                        checked={toolsConfig[t.key] ?? true}
                        onChange={(e) => setToolsConfig({ ...toolsConfig, [t.key]: e.target.checked })}
                        className="mt-0.5 accent-[#7B61FF]"
                      />
                      <div>
                        <span className="font-semibold text-white block">{t.label}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{t.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: GARDE-FOUS & SÉCURITÉ (🔒 TOUJOURS ACTIF) */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection("guardrails")}
            className="w-full p-5 flex items-center justify-between bg-[#14141E] border-b border-[#181824] hover:bg-[#181828] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base">4. Garde-fous & Sécurité (🔒 Toujours Actif)</h3>
                <p className="text-xs text-gray-400">Règles fondamentales non désactivables assurant l'intégrité de l'Agent</p>
              </div>
            </div>
            {openSections.guardrails ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {openSections.guardrails && (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                "Ne jamais inventer de prix non présent dans le catalogue SSOT",
                "Ne jamais inventer de stock disponible",
                "Ne jamais inventer de mode de paiement non configuré",
                "Ne jamais inventer de commande fictive",
                "Ne jamais inventer de délais de livraison irréalistes",
                "Ne jamais promettre de résultats de santé ou médicaux",
                "Respecter les demandes de désinscription des clients",
                "Respecter les limites strictes de l'organisation",
              ].map((rule, idx) => (
                <div key={idx} className="bg-[#181824] border border-emerald-500/20 p-3.5 rounded-xl flex items-center gap-3">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-gray-200 font-medium">{rule}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 6: INTERVENTION HUMAINE */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection("human")}
            className="w-full p-5 flex items-center justify-between bg-[#14141E] border-b border-[#181824] hover:bg-[#181828] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-white text-base">5. Intervention Humaine & Détection Smartphone</h3>
                <p className="text-xs text-gray-400">Prise en main automatique dès qu'un commercial répond depuis WhatsApp</p>
              </div>
            </div>
            {openSections.human ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {openSections.human && (
            <div className="p-6 space-y-4 text-xs text-gray-300">
              <div className="flex items-center justify-between bg-[#181824] p-4 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-bold text-white text-sm block">Détection Réponse Smartphone (fromMe = true)</span>
                    <span className="text-gray-400 text-xs">Passe automatiquement la discussion en mode HUMAN_ACTIVE</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  🟢 ACTIVÉE
                </span>
              </div>
              <p className="text-gray-400">
                Dès qu'un vendeur répond directement depuis l'application WhatsApp de son téléphone, le système détecte l'événement et coupe automatiquement l'Agent IA pour laisser la main au commercial.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 7: DISPONIBILITÉ & HORAIRES */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection("schedule")}
            className="w-full p-5 flex items-center justify-between bg-[#14141E] border-b border-[#181824] hover:bg-[#181828] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-base">6. Disponibilité & Horaires de Travail</h3>
                <p className="text-xs text-gray-400">Définissez les heures d'activité automatique de votre Agent IA</p>
              </div>
            </div>
            {openSections.schedule ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {openSections.schedule && (
            <div className="p-6 space-y-4">
              <label className="flex items-center gap-3 bg-[#181824] p-4 rounded-xl cursor-pointer border border-[#282838]">
                <input
                  type="checkbox"
                  checked={scheduleConfig.active}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, active: e.target.checked })}
                  className="accent-[#7B61FF]"
                />
                <div>
                  <span className="font-bold text-white text-sm block">Restreindre l'Agent IA à des horaires spécifiques</span>
                  <span className="text-xs text-gray-400">En dehors de ces heures, l'Agent enregistre le message sans répondre</span>
                </div>
              </label>

              {scheduleConfig.active && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 font-semibold">Heure Début</label>
                    <input
                      type="time"
                      value={scheduleConfig.startTime}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, startTime: e.target.value })}
                      className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 font-semibold">Heure Fin</label>
                    <input
                      type="time"
                      value={scheduleConfig.endTime}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, endTime: e.target.value })}
                      className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 font-semibold">Fuseau Horaire</label>
                    <input
                      type="text"
                      value={scheduleConfig.timezone}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, timezone: e.target.value })}
                      className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KNOWLEDGE ADD / EDIT MODAL */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] w-full max-w-lg p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingKnowledge ? "Modifier la Connaissance" : "Ajouter une Connaissance Métier"}
            </h3>

            <form onSubmit={handleSaveKnowledgeEntry} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Titre de la connaissance</label>
                <input
                  type="text"
                  placeholder="Ex: Conditions de remboursement"
                  value={knowledgeForm.title}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Catégorie</label>
                <select
                  value={knowledgeForm.category}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, category: e.target.value as any })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                >
                  <option value="ENTREPRISE">Entreprise</option>
                  <option value="LIVRAISON">Livraison</option>
                  <option value="PAIEMENT">Paiement</option>
                  <option value="FAQ">FAQ</option>
                  <option value="POLITIQUES">Politiques</option>
                  <option value="AUTRES">Autres</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Contenu détaillé</label>
                <textarea
                  rows={4}
                  placeholder="Expliquez clairement l'information métier que l'Agent IA doit connaître..."
                  value={knowledgeForm.content}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none font-sans"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKnowledgeModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REAL AGENT TESTER MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] w-full max-w-2xl p-6 rounded-3xl space-y-5 relative">
            <button
              onClick={() => setShowTestModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-[#181824]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#7B61FF]/10 border border-[#7B61FF]/20 rounded-2xl text-[#7B61FF]">
                <Play className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">🧪 Tester l'Agent IA (Vrai Backend)</h3>
                <p className="text-xs text-gray-400">Exécution en direct via l'API Anthropic Messages (`claude-sonnet-5`)</p>
              </div>
            </div>

            <form onSubmit={handleRunAgentTest} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Message Test du Client</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInputMessage}
                    onChange={(e) => setTestInputMessage(e.target.value)}
                    className="flex-1 bg-[#181824] border border-[#282838] rounded-xl p-3 text-white text-sm focus:border-[#7B61FF] outline-none"
                    placeholder="Écrivez une question pour tester l'Agent..."
                    required
                  />
                  <button
                    type="submit"
                    disabled={isExecutingTest}
                    className="px-5 py-3 bg-[#7B61FF] hover:bg-[#684DFE] disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-2"
                  >
                    {isExecutingTest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Tester
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* TEST RESULT OUTPUT */}
            {testResult && (
              <div className="bg-[#0B0B10] border border-[#181824] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between font-mono text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400">Résultat Anthropic API :</span>
                  {testResult.success ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HTTP 200 OK ({testResult.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ERREUR ({testResult.latencyMs}ms)
                    </span>
                  )}
                </div>

                {testResult.success ? (
                  <div className="space-y-2">
                    <div className="bg-[#181824] p-3.5 rounded-xl border border-white/5 text-sm text-gray-200">
                      <p className="whitespace-pre-wrap">{testResult.responseText}</p>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
                      <span>Modèle: <strong className="text-emerald-400">claude-sonnet-5</strong></span>
                      <span>•</span>
                      <span>Handoff: <strong className={testResult.triggerHandoff ? "text-amber-400" : "text-gray-400"}>{testResult.triggerHandoff ? "OUI" : "NON"}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                    <p>{testResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
