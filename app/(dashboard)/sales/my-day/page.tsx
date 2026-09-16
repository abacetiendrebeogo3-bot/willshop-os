"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/src/infrastructure/supabase/client";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { Card, Badge, Button } from "@/components/ui/card";
import {
  Sun,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Copy,
  MessageSquare,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Eye,
  RefreshCw,
  Zap,
  Package,
  Truck,
  DollarSign,
  User,
  Phone,
  HelpCircle,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Ban,
  CalendarCheck,
} from "lucide-react";
import {
  CommercialIntelligenceEngine,
  TodayActionItem,
  CommercialMorningBrief,
  ActionPriority,
  CommercialActionType,
} from "@/src/application/services/CommercialIntelligenceEngine";

export default function MyDayPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("WILLShop OS");
  const [commercialName, setCommercialName] = useState<string>("Awa");

  // Briefing & Actions State
  const [briefing, setBriefing] = useState<CommercialMorningBrief | null>(null);
  const [actionItems, setActionItems] = useState<TodayActionItem[]>([]);

  // Filters State
  const [timeFilter, setTimeFilter] = useState<"TODAY" | "TOMORROW" | "OVERDUE" | "THIS_WEEK" | "ALL">("TODAY");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | ActionPriority>("ALL");
  const [actionTypeFilter, setActionTypeFilter] = useState<"ALL" | CommercialActionType>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"CARDS" | "CALENDAR">("CARDS");

  // UI Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Copy suggested message to clipboard helper
  const handleCopyMessage = (text: string, clientName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`📋 Message pour ${clientName} copié dans le presse-papier !`);
  };

  // Load Real Data & Generate Intelligence Briefing
  const loadMyDayData = async () => {
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
            .select("name")
            .eq("id", targetOrgId)
            .single();

          if (org) setOrganizationName(org.name || "WILLShop OS");
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, first_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setCommercialName(profile.first_name || profile.full_name || "Commercial");
        }
      }

      setOrganizationId(targetOrgId);
      if (!targetOrgId) {
        setLoading(false);
        return;
      }

      // Generate Commercial Morning Brief & Actions
      const brief = await CommercialIntelligenceEngine.generateCommercialMorningBrief(
        supabase,
        targetOrgId,
        user?.id
      );

      setBriefing(brief);
      setActionItems(brief.priorityActions || []);
    } catch (err) {
      console.error("Erreur de chargement Ma Journée:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyDayData();
  }, []);

  // Action Handlers (Persist state changes in Supabase DB)
  const handleMarkAsTreated = async (actionId: string, clientName: string) => {
    setActionItems((prev) =>
      prev.map((item) =>
        item.id === actionId ? { ...item, status: "TREATED", treatedAt: new Date() } : item
      )
    );
    showToast(`✅ Action pour ${clientName} marquée comme traitée !`);

    if (organizationId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("ai_actions").insert({
          organization_id: organizationId,
          action_type: "TODAY_ACTION_TREATED",
          permission_level: "GREEN",
          status: "EXECUTED",
          metadata: {
            action_id: actionId,
            status: "DONE",
            client_name: clientName,
            completed_by: user?.id || null,
            completed_at: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("Erreur de persistance de l'action traitée:", err);
      }
    }
  };

  const handlePostponeAction = async (actionId: string, clientName: string) => {
    setActionItems((prev) =>
      prev.map((item) =>
        item.id === actionId
          ? {
              ...item,
              status: "POSTPONED",
              dueAt: new Date(Date.now() + 24 * 3600 * 1000),
            }
          : item
      )
    );
    showToast(`⏳ Action pour ${clientName} reportée à demain.`);

    if (organizationId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("ai_actions").insert({
          organization_id: organizationId,
          action_type: "TODAY_ACTION_POSTPONED",
          permission_level: "GREEN",
          status: "EXECUTED",
          metadata: {
            action_id: actionId,
            status: "POSTPONED",
            client_name: clientName,
            completed_by: user?.id || null,
            completed_at: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("Erreur de persistance de l'action reportée:", err);
      }
    }
  };

  const handleIgnoreAction = async (actionId: string, clientName: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === actionId ? { ...item, status: "IGNORED" } : item))
    );
    showToast(`🙈 Action pour ${clientName} ignorée.`);

    if (organizationId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("ai_actions").insert({
          organization_id: organizationId,
          action_type: "TODAY_ACTION_IGNORED",
          permission_level: "GREEN",
          status: "EXECUTED",
          metadata: {
            action_id: actionId,
            status: "IGNORED",
            client_name: clientName,
            completed_by: user?.id || null,
            completed_at: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("Erreur de persistance de l'action ignorée:", err);
      }
    }
  };

  // Filter Items
  const filteredActions = actionItems.filter((item) => {
    // Hide ignored items from default list
    if (item.status === "IGNORED") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.customerName.toLowerCase().includes(q);
      const matchPhone = item.customerPhone.includes(q);
      const matchProduct = (item.productInterest || "").toLowerCase().includes(q);
      const matchReason = item.reasonTitle.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchProduct && !matchReason) return false;
    }

    // Priority filter
    if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;

    // Action type filter
    if (actionTypeFilter !== "ALL" && item.actionType !== actionTypeFilter) return false;

    return true;
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
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
              <Sun className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                ☀️ Ma Journée — Copilot Commercial
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Espace de supervision et de recommandation commerciale. WILLShop OS analyse et vous prépare vos actions du jour.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>MODE OBSERVE_ONLY (RECOMMANDATIONS 100% HUMAINES)</span>
          </div>

          <button
            onClick={loadMyDayData}
            className="flex items-center gap-2 px-4 py-2 bg-[#12121A] hover:bg-[#181824] border border-[#242436] text-gray-300 font-medium rounded-xl text-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#7B61FF]" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* COMMERCIAL MORNING BRIEF BANNER */}
      {briefing && (
        <div className="bg-gradient-to-r from-[#12121A] via-[#161622] to-[#1A1A2A] border border-[#242436] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[#7B61FF] uppercase tracking-wider font-bold">
                BRIEFING MATINAL COMMERCIAL
              </span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {briefing.summaryHeadline}
              </h2>
            </div>
          </div>

          {/* SUMMARY STATS TILES */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#0A0A14] border border-red-500/30 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] text-red-300 font-mono block">🔴 URGENTS</span>
              <span className="text-2xl font-bold text-white">{briefing.stats.urgentCount}</span>
              <p className="text-[10px] text-gray-400">Interventions prioritaires</p>
            </div>

            <div className="bg-[#0A0A14] border border-[#7B61FF]/30 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] text-[#7B61FF] font-mono block">💬 RELANCES PROSPECTS</span>
              <span className="text-2xl font-bold text-white">{briefing.stats.prospectsToFollowupCount}</span>
              <p className="text-[10px] text-gray-400">Prospects tièdes / chauds</p>
            </div>

            <div className="bg-[#0A0A14] border border-amber-500/30 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] text-amber-300 font-mono block">🛒 COMMANDES</span>
              <span className="text-2xl font-bold text-white">{briefing.stats.ordersToFollowCount}</span>
              <p className="text-[10px] text-gray-400">En attente de confirmation</p>
            </div>

            <div className="bg-[#0A0A14] border border-blue-500/30 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] text-blue-300 font-mono block">🚚 LIVRAISONS</span>
              <span className="text-2xl font-bold text-white">{briefing.stats.deliveriesToReviewCount}</span>
              <p className="text-[10px] text-gray-400">En cours / échecs</p>
            </div>

            <div className="bg-[#0A0A14] border border-emerald-500/30 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] text-emerald-300 font-mono block">💰 PAIEMENTS</span>
              <span className="text-2xl font-bold text-white">{briefing.stats.paymentsToCheckCount}</span>
              <p className="text-[10px] text-gray-400">À vérifier / encaisser</p>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS BAR: SEARCH, FILTERS & VIEW MODE */}
      <div className="bg-[#12121A] border border-[#181824] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher prospect, téléphone, produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7B61FF]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-[#0A0A14] border border-[#242436] text-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7B61FF]"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="URGENT">🔴 Urgent uniquement</option>
            <option value="IMPORTANT">🟠 Important uniquement</option>
            <option value="TO_DO">🟡 À faire uniquement</option>
            <option value="MONITOR">🟢 À surveiller</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0A0A14] border border-[#242436] rounded-xl p-1">
            <button
              onClick={() => setViewMode("CARDS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "CARDS" ? "bg-[#7B61FF] text-white shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              Grille d&apos;Actions
            </button>
            <button
              onClick={() => setViewMode("CALENDAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "CALENDAR" ? "bg-[#7B61FF] text-white shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              Vue Calendrier
            </button>
          </div>
        </div>
      </div>

      {/* ACTION CARDS GRID VIEW */}
      {viewMode === "CARDS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase tracking-wider px-1">
            <span>
              ACTIONS RECOMMANDÉES POUR AUJOURD&apos;HUI ({filteredActions.length})
            </span>
            <span>CLIQUEZ SUR [COPIER LE MESSAGE] POUR RELANCER EN UN CLIC SUR WHATSAPP</span>
          </div>

          {filteredActions.length === 0 ? (
            <div className="bg-[#12121A] border border-[#181824] rounded-3xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Toutes vos actions sont à jour !</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Aucune action urgente ou relance en attente pour le moment. L&apos;IA continue d&apos;observer les conversations en arrière-plan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActions.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[#12121A] border rounded-3xl p-5 space-y-4 transition-all hover:border-gray-700 shadow-xl ${
                    item.status === "TREATED"
                      ? "opacity-60 border-emerald-500/30"
                      : item.priority === "URGENT"
                      ? "border-red-500/40 bg-red-950/10"
                      : item.priority === "IMPORTANT"
                      ? "border-amber-500/40"
                      : "border-[#181824]"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#181824] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                            item.priority === "URGENT"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse"
                              : item.priority === "IMPORTANT"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : item.priority === "TO_DO"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {item.priority === "URGENT"
                            ? "🔴 URGENT"
                            : item.priority === "IMPORTANT"
                            ? "🟠 IMPORTANT"
                            : item.priority === "TO_DO"
                            ? "🟡 À FAIRE"
                            : "🟢 SURVEILLER"}
                        </span>

                        <span className="text-[10px] font-mono text-gray-400 uppercase bg-[#0A0A14] px-2 py-0.5 rounded border border-[#242436]">
                          {item.actionType.replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#7B61FF]" />
                        {item.customerName}
                        <span className="text-xs text-gray-400 font-mono">({item.customerPhone})</span>
                      </h3>
                    </div>

                    {item.status === "TREATED" && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Traité
                      </span>
                    )}
                  </div>

                  {/* PRODUCT & ORDER CONTEXT */}
                  {(item.productInterest || item.orderId) && (
                    <div className="flex items-center gap-3 text-xs text-gray-300 bg-[#0A0A14] p-2.5 rounded-xl border border-[#181824]">
                      {item.productInterest && (
                        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                          <Package className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.productInterest}</span>
                        </div>
                      )}
                      {item.orderId && (
                        <div className="flex items-center gap-1.5 text-blue-300 font-mono">
                          <ShoppingBagIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span>#{item.orderId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* "POURQUOI ?" EVIDENCE PROVENANCE */}
                  <div className="space-y-1 bg-[#0A0A14] border border-amber-500/20 p-3 rounded-xl">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Pourquoi cette action est recommandée ?
                    </span>
                    <p className="text-xs text-gray-300">{item.reasonDescription}</p>
                    {item.evidence && item.evidence.length > 0 && (
                      <ul className="list-disc pl-4 text-[11px] text-gray-400 space-y-0.5 mt-1 font-mono">
                        {item.evidence.map((ev, idx) => (
                          <li key={idx}>{ev}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* SUGGESTED MESSAGE BOX FOR COMMERCIAL MANUAL SENDING */}
                  {item.suggestedResponse && (
                    <div className="space-y-1.5 bg-[#0D0D18] border border-[#7B61FF]/30 p-3.5 rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#7B61FF]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Suggestion de message à envoyer :
                        </span>
                        <button
                          onClick={() => handleCopyMessage(item.suggestedResponse, item.customerName)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-[#7B61FF]/20 hover:bg-[#7B61FF]/40 text-white rounded font-normal text-[10px] transition-all"
                        >
                          <Copy className="w-3 h-3" /> Copier
                        </button>
                      </div>
                      <p className="text-xs text-gray-200 whitespace-pre-wrap italic font-sans">
                        &quot;{item.suggestedResponse}&quot;
                      </p>
                    </div>
                  )}

                  {/* CARD FOOTER ACTIONS */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#181824]">
                    <Link
                      href={`/sales/inbox?conversationId=${item.conversationId}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A14] hover:bg-[#181824] text-gray-300 hover:text-white rounded-xl text-xs border border-[#242436] font-medium transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      Voir conversation
                    </Link>

                    <div className="flex items-center gap-2">
                      {item.status !== "TREATED" && (
                        <>
                          <button
                            onClick={() => handlePostponeAction(item.id, item.customerName)}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium transition-all"
                          >
                            Reporter
                          </button>

                          <button
                            onClick={() => handleMarkAsTreated(item.id, item.customerName)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Traité
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === "CALENDAR" && (
        <div className="bg-[#12121A] border border-[#181824] rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#181824] pb-4">
            <CalendarIcon className="w-6 h-6 text-[#7B61FF]" />
            <div>
              <h3 className="text-lg font-bold text-white">📅 Agenda des Actions Commerciales</h3>
              <p className="text-xs text-gray-400">Échéances organisées par plage temporelle.</p>
            </div>
          </div>

          <div className="space-y-6 font-mono text-xs">
            {/* TODAY BLOCK */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-amber-300 border-b border-amber-500/30 pb-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> AUJOURD&apos;HUI ({filteredActions.length} actions)
              </h4>
              <div className="space-y-2">
                {filteredActions.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0A0A14] border border-[#242436] p-3 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-bold">
                        {item.dueAt ? new Date(item.dueAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "09:00"}
                      </span>
                      <span className="font-bold text-white">{item.customerName}</span>
                      <span className="text-gray-400">({item.reasonTitle})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(item.suggestedResponse, item.customerName)}
                        className="px-2.5 py-1 bg-[#7B61FF]/20 text-[#7B61FF] rounded hover:bg-[#7B61FF]/40 transition-all font-sans text-xs"
                      >
                        Copier Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
