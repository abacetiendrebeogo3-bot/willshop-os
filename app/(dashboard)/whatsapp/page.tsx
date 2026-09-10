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
  LogOut,
  Loader2,
  Smartphone,
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

  // Collections State
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals State
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Real Evolution QR Code Flow States
  const [isInitializingInstance, setIsInitializingInstance] = useState<boolean>(false);
  const [isRefreshingQr, setIsRefreshingQr] = useState<boolean>(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [qrPairingCode, setQrPairingCode] = useState<string | null>(null);
  const [qrModalStatus, setQrModalStatus] = useState<
    "INITIALIZING" | "WAITING_QR" | "CONNECTED" | "ERROR"
  >("INITIALIZING");
  const [qrErrorMessage, setQrErrorMessage] = useState<string | null>(null);
  const [connectedPhoneNumber, setConnectedPhoneNumber] = useState<string | null>(null);

  // Form states
  const [connectForm, setConnectForm] = useState({
    phoneNumber: "",
    displayName: "WILLShop Commercial",
    provider: "EVOLUTION", // Default to Evolution for private pilot
    providerPhoneNumberId: "willshop_pilot",
  });

  const [searchQuery, setSearchQuery] = useState<string>("");

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
        const primaryNumber = numRows.find((n: any) => n.status === "ACTIVE") || numRows[0];
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

  // Polling for Evolution Status when QR modal is open
  useEffect(() => {
    let pollTimer: NodeJS.Timeout | null = null;

    if (showQrModal && (qrModalStatus === "WAITING_QR" || qrModalStatus === "INITIALIZING")) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch("/api/whatsapp/evolution/status");
          if (!res.ok) return;

          const data = await res.json();
          if (data.status === "CONNECTED") {
            setQrModalStatus("CONNECTED");
            setConnectedPhoneNumber(data.phoneNumber || null);
            showToast(`🟢 WhatsApp connecté avec succès ! (${data.phoneNumber || ""})`);
            await loadHubData();
            if (pollTimer) clearInterval(pollTimer);
          } else if (data.status === "WAITING_QR") {
            setQrModalStatus("WAITING_QR");
            if (data.qrCode?.base64) {
              setQrBase64(data.qrCode.base64);
            }
            if (data.qrCode?.code) {
              setQrCodeText(data.qrCode.code);
            }
            if (data.qrCode?.pairingCode) {
              setQrPairingCode(data.qrCode.pairingCode);
            }
          } else if (data.status === "ERROR") {
            setQrModalStatus("ERROR");
            setQrErrorMessage(data.error || "Erreur de connexion Evolution");
            if (pollTimer) clearInterval(pollTimer);
          }
        } catch (err) {
          console.error("Erreur polling status Evolution:", err);
        }
      }, 3000);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [showQrModal, qrModalStatus]);

  // Start Real Evolution Connect Flow (QR Code)
  const handleStartEvolutionConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsInitializingInstance(true);
    setQrErrorMessage(null);
    setShowConnectModal(false);
    setShowQrModal(true);
    setQrModalStatus("INITIALIZING");

    try {
      const res = await fetch("/api/whatsapp/evolution/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setQrModalStatus("ERROR");
        setQrErrorMessage(data.error || "Échec de création de l'instance Evolution API");
        return;
      }

      if (data.state === "CONNECTED") {
        setQrModalStatus("CONNECTED");
        setConnectedPhoneNumber(data.phoneNumber || null);
        showToast("🟢 Ligne WhatsApp Evolution déjà connectée !");
        await loadHubData();
        return;
      }

      setQrModalStatus("WAITING_QR");
      if (data.qrCode) {
        setQrBase64(data.qrCode.base64 || null);
        setQrCodeText(data.qrCode.code || null);
        setQrPairingCode(data.qrCode.pairingCode || null);
      }
    } catch (err: any) {
      setQrModalStatus("ERROR");
      setQrErrorMessage(err.message || "Erreur réseau lors de la création de l'instance");
    } finally {
      setIsInitializingInstance(false);
    }
  };

  // Refresh QR Code manually
  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    try {
      const res = await fetch("/api/whatsapp/evolution/status");
      const data = await res.json();
      if (data.qrCode?.base64) {
        setQrBase64(data.qrCode.base64);
      }
      if (data.qrCode?.code) {
        setQrCodeText(data.qrCode.code);
      }
      if (data.qrCode?.pairingCode) {
        setQrPairingCode(data.qrCode.pairingCode);
      }
      showToast("🔄 QR Code rafraîchi");
    } catch (err) {
      console.error("Erreur rafraîchissement QR:", err);
    } finally {
      setIsRefreshingQr(false);
    }
  };

  // Disconnect Evolution WhatsApp Line
  const handleDisconnectWhatsApp = async () => {
    if (!confirm("Voulez-vous vraiment déconnecter votre ligne WhatsApp Evolution ?")) return;
    try {
      const res = await fetch("/api/whatsapp/evolution/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(`Erreur déconnexion: ${data.error || "Erreur serveur"}`);
        return;
      }
      showToast("🔴 Ligne WhatsApp déconnectée");
      await loadHubData();
    } catch (err: any) {
      alert(`Erreur déconnexion: ${err.message}`);
    }
  };

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

  // Connect WhatsApp (For Meta Cloud API fallback or Submission router)
  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (connectForm.provider === "EVOLUTION") {
      await handleStartEvolutionConnect();
      return;
    }

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

          {whatsappConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartEvolutionConnect()}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all text-xs font-semibold"
              >
                <QrCode className="w-4 h-4" />
                Voir QR / Statut
              </button>
              <button
                onClick={handleDisconnectWhatsApp}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Déconnecter
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg text-sm"
            >
              <Phone className="w-4 h-4" />
              Connecter un Numéro
            </button>
          )}
        </div>
      </div>

      {/* STATUS BAR (Honest UI States) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">STATUT LIGNE</span>
          {whatsappConnected ? (
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
              🟢 CONNECTÉ (ACTIVE)
            </span>
          ) : (
            <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              🟡 NON CONFIGURÉ
            </span>
          )}
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">NUMÉRO RÉEL CONNECTÉ</span>
          <span className="font-bold text-white text-sm">
            {whatsappNumberInfo?.phone_number || "Aucun numéro"}
          </span>
        </div>
        <div className="bg-[#12121A] border border-[#181824] p-4 rounded-xl space-y-1">
          <span className="text-gray-400 block">PROVIDER TECH</span>
          <span className="font-bold text-blue-400 text-sm">
            {whatsappNumberInfo?.provider || "EVOLUTION (Baileys)"}
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

      {/* CONNECT FORM MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Connecter une Ligne WhatsApp</h3>
            <form onSubmit={handleConnectWhatsApp} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Provider WhatsApp</label>
                <select
                  value={connectForm.provider}
                  onChange={(e) => setConnectForm({ ...connectForm, provider: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2.5 text-white text-sm focus:border-[#7B61FF] outline-none"
                >
                  <option value="EVOLUTION">Evolution API (Pilote Privé — Appairage QR Code)</option>
                  <option value="META_CLOUD_API">Meta Cloud API (Officiel API Key)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Nom de la Ligne</label>
                <input
                  type="text"
                  placeholder="WILLShop Commercial"
                  value={connectForm.displayName}
                  onChange={(e) => setConnectForm({ ...connectForm, displayName: e.target.value })}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2.5 text-white text-sm focus:border-[#7B61FF] outline-none"
                />
              </div>

              {connectForm.provider === "EVOLUTION" ? (
                <div className="p-3 bg-[#7B61FF]/10 border border-[#7B61FF]/20 rounded-xl text-xs text-gray-300 space-y-1">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#7B61FF]" />
                    Connexion par QR Code Evolution API
                  </p>
                  <p>
                    Le système va créer votre instance privée sécurisée et générer un QR Code unique à scanner depuis WhatsApp Business sur votre smartphone.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 font-medium">Numéro de Téléphone (E.164)</label>
                    <input
                      type="text"
                      placeholder="+22670000000"
                      value={connectForm.phoneNumber}
                      onChange={(e) => setConnectForm({ ...connectForm, phoneNumber: e.target.value })}
                      className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2.5 text-white text-sm focus:border-[#7B61FF] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 font-medium">Phone Number ID Meta</label>
                    <input
                      type="text"
                      placeholder="10023456789"
                      value={connectForm.providerPhoneNumberId}
                      onChange={(e) => setConnectForm({ ...connectForm, providerPhoneNumberId: e.target.value })}
                      className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2.5 text-white text-sm focus:border-[#7B61FF] outline-none"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  {connectForm.provider === "EVOLUTION" ? (
                    <>
                      <QrCode className="w-4 h-4" />
                      Générer le QR Code
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REAL QR CODE FLOW MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] w-full max-w-lg p-6 rounded-3xl space-y-5 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-[#181824]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#7B61FF]/10 border border-[#7B61FF]/20 rounded-2xl text-[#7B61FF]">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Connecter WhatsApp</h3>
                <p className="text-xs text-gray-400">Evolution API — Appairage QR Code</p>
              </div>
            </div>

            {/* STATUS BADGE */}
            <div className="flex items-center justify-between bg-[#181824] p-3 rounded-2xl font-mono text-xs">
              <span className="text-gray-400">Statut :</span>
              {qrModalStatus === "INITIALIZING" && (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  🟡 Connexion en cours...
                </span>
              )}
              {qrModalStatus === "WAITING_QR" && (
                <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                  🟡 En attente de connexion
                </span>
              )}
              {qrModalStatus === "CONNECTED" && (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  🟢 CONNECTÉ ({connectedPhoneNumber || "Prêt"})
                </span>
              )}
              {qrModalStatus === "ERROR" && (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  🔴 ERREUR DE CONNEXION
                </span>
              )}
            </div>

            {/* QR CODE CONTAINER */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#0B0B10] border border-[#181824] rounded-2xl space-y-4">
              {qrModalStatus === "INITIALIZING" && (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-10 h-10 text-[#7B61FF] animate-spin" />
                  <p className="text-sm text-gray-400">Création de votre instance sécurisée Evolution...</p>
                </div>
              )}

              {qrModalStatus === "WAITING_QR" && (
                <>
                  {qrBase64 ? (
                    <div className="p-3 bg-white rounded-2xl border-4 border-[#7B61FF]/30 shadow-2xl">
                      <img
                        src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                        alt="QR Code WhatsApp Evolution"
                        className="w-56 h-56 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-56 w-56 flex flex-col items-center justify-center bg-[#12121A] rounded-2xl border border-dashed border-[#282838] p-4 text-center">
                      <Loader2 className="w-8 h-8 text-[#7B61FF] animate-spin mb-2" />
                      <p className="text-xs text-gray-400 font-mono">Génération du QR Code...</p>
                    </div>
                  )}

                  {qrPairingCode && (
                    <div className="bg-[#181824] px-4 py-2 rounded-xl text-center">
                      <span className="text-[11px] text-gray-400 block font-mono">Code d'association :</span>
                      <span className="text-lg font-bold font-mono text-[#7B61FF] tracking-widest">{qrPairingCode}</span>
                    </div>
                  )}
                </>
              )}

              {qrModalStatus === "CONNECTED" && (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Appareil WhatsApp Appairé !</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Numéro connecté : <span className="font-mono text-emerald-400">{connectedPhoneNumber || "N/A"}</span>
                  </p>
                </div>
              )}

              {qrModalStatus === "ERROR" && (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-center p-4">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                  <p className="text-sm text-red-300 font-semibold">{qrErrorMessage || "Impossible de contacter Evolution API"}</p>
                  <p className="text-xs text-gray-400">Vérifiez que les variables EVOLUTION_API_URL et EVOLUTION_API_KEY sont correctement configurées.</p>
                </div>
              )}
            </div>

            {/* INSTRUCTIONS */}
            {qrModalStatus === "WAITING_QR" && (
              <div className="bg-[#181824]/60 p-4 rounded-2xl border border-white/5 space-y-2 text-xs text-gray-300">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#7B61FF]" />
                  Instructions de connexion :
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-400 font-mono">
                  <li>Ouvrez <strong className="text-white">WhatsApp Business</strong> sur votre téléphone.</li>
                  <li>Ouvrez <strong className="text-white">Réglages / Menu (⋮)</strong> ➔ <strong className="text-white">Appareils connectés</strong>.</li>
                  <li>Appuyez sur <strong className="text-white">Connecter un appareil</strong>.</li>
                  <li>Scannez ce QR Code.</li>
                </ol>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-2">
              {qrModalStatus === "WAITING_QR" ? (
                <button
                  onClick={handleRefreshQr}
                  disabled={isRefreshingQr}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQr ? "animate-spin" : ""}`} />
                  Actualiser le QR
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setShowQrModal(false)}
                className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white rounded-xl text-xs font-semibold transition-all"
              >
                {qrModalStatus === "CONNECTED" ? "Terminer" : "Annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
