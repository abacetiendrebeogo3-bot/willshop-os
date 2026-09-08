"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/src/infrastructure/supabase/client";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  Phone,
  Bot,
  Settings,
  Play,
  CheckCircle2,
  X,
  Plus,
  Send,
  User,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Cpu,
  ShieldAlert,
  Clock,
  Radio,
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sliders,
  CheckSquare,
  Copy,
  Lock,
  QrCode,
} from "lucide-react";

export default function WhatsAppHubPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "conversations" | "evolution" | "config" | "guardrails" | "playground"
  >("overview");

  // Context State
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("WILLShop OS");
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappNumberInfo, setWhatsappNumberInfo] = useState<any>(null);
  const [aiAgentEnabled, setAiAgentEnabled] = useState<boolean>(true);
  const [aiKillSwitch, setAiKillSwitch] = useState<boolean>(false);

  // Evolution API State
  const [evolutionInstance, setEvolutionInstance] = useState<string>("willshop_pilot");
  const [evolutionStatus, setEvolutionStatus] = useState<"CONNECTED" | "DISCONNECTED" | "CONNECTING">("DISCONNECTED");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Collections State
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showNewMsgModal, setShowNewMsgModal] = useState<boolean>(false);

  // Form states
  const [connectForm, setConnectForm] = useState({
    phoneNumber: "",
    displayName: "WILLShop Commercial",
    provider: "EVOLUTION", // Default to Evolution for private pilot
    providerPhoneNumberId: "willshop_pilot",
  });

  const [newMsgForm, setNewMsgForm] = useState({
    customerId: "",
    messageText: "",
  });

  const [replyInput, setReplyInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [convStatusFilter, setConvStatusFilter] = useState<string>("ALL");

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load All Hub Data
  const loadHubData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let targetOrgId = "";
      let targetOrgName = "WILLShop OS";

      if (user) {
        const { data: userRoles } = await supabase
          .from("user_organization_roles")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .is("deleted_at", null);

        if (userRoles && userRoles.length > 0) {
          targetOrgId = userRoles[0].organization_id;
          const { data: org } = await supabase
            .from("organizations")
            .select("name, settings")
            .eq("id", targetOrgId)
            .single();

          if (org) {
            targetOrgName = org.name;
          }
        }
      }

      if (!targetOrgId) {
        const { data: fallbackOrgs } = await supabase
          .from("organizations")
          .select("id, name, settings")
          .limit(1);

        if (fallbackOrgs && fallbackOrgs.length > 0) {
          targetOrgId = fallbackOrgs[0].id;
          targetOrgName = fallbackOrgs[0].name;
        }
      }

      setOrganizationId(targetOrgId);
      setOrganizationName(targetOrgName);

      if (!targetOrgId) {
        setIsLoading(false);
        return;
      }

      // 1. Fetch Registered WhatsApp Numbers
      const { data: numRows } = await supabase
        .from("whatsapp_numbers")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

      if (numRows && numRows.length > 0) {
        const primaryNumber = numRows[0];
        setWhatsappConnected(primaryNumber.status === "ACTIVE");
        setWhatsappNumberInfo(primaryNumber);
      } else {
        setWhatsappConnected(false);
        setWhatsappNumberInfo(null);
      }

      // 2. Fetch Conversations with Modes
      const { data: convRows } = await supabase
        .from("conversations")
        .select("*, customers(first_name, last_name, phone, email)")
        .eq("organization_id", targetOrgId)
        .order("last_message_at", { ascending: false });

      const mappedConvs = (convRows || []).map((c) => {
        const custName = c.customers
          ? `${c.customers.first_name || ""} ${c.customers.last_name || ""}`.trim()
          : "Prospect WhatsApp";
        const custPhone = c.customers?.phone || c.external_conversation_id || "Non spécifié";

        return {
          id: c.id,
          customerId: c.customer_id,
          customerName: custName || "Prospect WhatsApp",
          phoneNumber: custPhone,
          status: c.status,
          conversationMode: c.conversation_mode || "AI_ACTIVE",
          assignedAgent: c.assigned_agent || "SALES_AI",
          unreadCount: c.unread_count || 0,
          updatedAt: c.last_message_at
            ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
        };
      });

      setConversations(mappedConvs);
      if (mappedConvs.length > 0 && !selectedConv) {
        setSelectedConv(mappedConvs[0]);
      }
    } catch (err) {
      console.error("Erreur chargement Hub WhatsApp:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages for active conversation
  const loadMessagesForConv = async (convId: string) => {
    if (!convId) return;
    try {
      const supabase = createClient();
      const { data: msgRows } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      setMessages(
        (msgRows || []).map((m) => ({
          id: m.id,
          senderType: m.sender_type,
          direction: m.direction,
          content: m.content || "",
          status: m.status,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }))
      );
    } catch (err) {
      console.error("Erreur chargement messages:", err);
    }
  };

  useEffect(() => {
    loadHubData();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessagesForConv(selectedConv.id);
    }
  }, [selectedConv]);

  // Toggle Conversation Mode (AI_ACTIVE <-> HUMAN_ACTIVE)
  const handleToggleConvMode = async (convId: string, currentMode: string) => {
    const nextMode = currentMode === "AI_ACTIVE" ? "HUMAN_ACTIVE" : "AI_ACTIVE";
    try {
      const supabase = createClient();
      await supabase
        .from("conversations")
        .update({ conversation_mode: nextMode, assigned_agent: nextMode === "AI_ACTIVE" ? "SALES_AI" : "HUMAN" })
        .eq("id", convId);

      showToast(nextMode === "AI_ACTIVE" ? "🟢 Agent IA réactivé pour cette discussion" : "👤 Main prise par le commercial humain");
      await loadHubData();
      if (selectedConv?.id === convId) {
        setSelectedConv((prev: any) => ({ ...prev, conversationMode: nextMode }));
      }
    } catch (err: any) {
      alert(`Erreur bascule mode: ${err.message}`);
    }
  };

  // Connect WhatsApp Number
  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectForm.phoneNumber.trim() || !organizationId) return;

    try {
      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        phone_number: connectForm.phoneNumber.trim(),
        display_name: connectForm.displayName.trim() || "WILLShop Commercial",
        provider: connectForm.provider,
        provider_phone_number_id: connectForm.providerPhoneNumberId.trim(),
        status: "ACTIVE",
      };

      const { error } = await supabase.from("whatsapp_numbers").insert(payload);
      if (error) throw error;

      showToast(`🟢 Ligne WhatsApp (${connectForm.provider}) connectée avec succès !`);
      setShowConnectModal(false);
      await loadHubData();
    } catch (err: any) {
      alert(`Erreur connexion WhatsApp: ${err.message}`);
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

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#7B61FF]/10 rounded-2xl border border-[#7B61FF]/20 text-[#7B61FF]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                💬 WhatsApp & Hub Commercial IA
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Pilotez vos lignes Evolution API (Baileys) et Meta Cloud API avec synchronisation smartphone et prise en main humaine.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge
            type={whatsappConnected ? "DATABASE" : "NOT_CONFIGURED"}
            label={whatsappConnected ? `WHATSAPP ${whatsappNumberInfo?.provider || 'ACTIF'}` : "WHATSAPP PENDING"}
          />

          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg text-sm"
          >
            <Phone className="w-4 h-4" />
            Connecter un Numéro
          </button>
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">PROVIDER ACTIF</span>
          <span className="font-bold text-emerald-400 text-sm">
            {whatsappNumberInfo?.provider || "EVOLUTION API"}
          </span>
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">NUMÉRO CONFIGURÉ</span>
          <span className="font-bold text-white text-sm">
            {whatsappNumberInfo?.phone_number || "Aucun numéro"}
          </span>
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">CONVERSATIONS</span>
          <span className="font-bold text-blue-400 text-sm">
            {conversations.length} Active(s)
          </span>
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">SYNCHRO SMARTPHONE</span>
          <span className="font-bold text-emerald-400 text-sm flex items-center gap-1">
            🟢 Detect (fromMe)
          </span>
        </div>
      </div>

      {/* CONVERSATIONS & CHAT INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
        {/* CONVERSATIONS LIST */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">Discussions WhatsApp</h3>
            <span className="text-xs bg-[#7B61FF]/20 text-[#7B61FF] px-2 py-0.5 rounded-full font-mono">
              {conversations.length}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                  selectedConv?.id === conv.id
                    ? "bg-[#7B61FF]/10 border-[#7B61FF]/40 text-white"
                    : "bg-[#181824]/50 border-transparent hover:bg-[#181824] text-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">{conv.customerName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleConvMode(conv.id, conv.conversationMode);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono border transition-all ${
                      conv.conversationMode === "AI_ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {conv.conversationMode === "AI_ACTIVE" ? "🟢 IA Actif" : "👤 Main Humaine"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">{conv.phoneNumber}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT MESSAGES PANEL */}
        <div className="lg:col-span-2 bg-[#12121A] border border-[#181824] rounded-2xl p-4 flex flex-col h-full">
          {selectedConv ? (
            <>
              <div className="flex items-center justify-between border-b border-[#181824] pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-white">{selectedConv.customerName}</h3>
                  <span className="text-xs text-gray-400 font-mono">{selectedConv.phoneNumber}</span>
                </div>
                <button
                  onClick={() => handleToggleConvMode(selectedConv.id, selectedConv.conversationMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    selectedConv.conversationMode === "AI_ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  {selectedConv.conversationMode === "AI_ACTIVE" ? "Desactiver IA" : "Activer IA"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.direction === "OUTBOUND" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-sm ${
                        msg.direction === "OUTBOUND"
                          ? msg.senderType === "AI"
                            ? "bg-[#7B61FF] text-white rounded-br-none"
                            : "bg-emerald-600 text-white rounded-br-none"
                          : "bg-[#181824] text-gray-200 rounded-bl-none border border-white/5"
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 font-mono">
                      {msg.senderType} • {msg.time}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Sélectionnez une discussion WhatsApp pour afficher les messages.
            </div>
          )}
        </div>
      </div>

      {/* CONNECT MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Connecter une Ligne WhatsApp</h3>
            <form onSubmit={handleConnectWhatsApp} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Provider</label>
                <select
                  value={connectForm.provider}
                  onChange={(e) => setConnectForm({ ...connectForm, provider: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2.5 text-white text-sm"
                >
                  <option value="EVOLUTION">Evolution API (Baileys / Pilote Private)</option>
                  <option value="META_CLOUD_API">Meta Cloud API (Officiel)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Numéro de Téléphone (E.164)</label>
                <input
                  type="text"
                  placeholder="+22670000000"
                  value={connectForm.phoneNumber}
                  onChange={(e) => setConnectForm({ ...connectForm, phoneNumber: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2.5 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Instance / Phone Number ID</label>
                <input
                  type="text"
                  placeholder="willshop_pilot"
                  value={connectForm.providerPhoneNumberId}
                  onChange={(e) => setConnectForm({ ...connectForm, providerPhoneNumberId: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2.5 text-white text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7B61FF] text-white rounded-xl text-sm font-semibold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
