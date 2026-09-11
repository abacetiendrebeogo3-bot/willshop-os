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
  MoreVertical,
  Trash2,
  Archive,
  Check,
  CheckCheck,
  PauseCircle,
  AlertCircle,
} from "lucide-react";

export default function WhatsAppHubPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "conversations" | "evolution" | "config" | "guardrails" | "playground"
  >("conversations");

  // Context State
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("WILLShop OS");
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappNumberInfo, setWhatsappNumberInfo] = useState<any>(null);

  // Collections State
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter Tabs
  const [filterTab, setFilterTab] = useState<
    "ACTIVE" | "ALL" | "AI_ACTIVE" | "HUMAN_ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals State
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [openMenuConvId, setOpenMenuConvId] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "TOGGLE_AI" | "SOFT_DELETE" | "ARCHIVE" | "PAUSE" | "ESCALATED";
    convId: string;
    convName: string;
    targetMode?: string;
    targetStatus?: string;
    title: string;
    message: string;
    warningText?: string;
    confirmText: string;
  } | null>(null);

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

  // Chat send state
  const [newMessageText, setNewMessageText] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Form states
  const [connectForm, setConnectForm] = useState({
    phoneNumber: "",
    displayName: "WILLShop Commercial",
    provider: "EVOLUTION",
    providerPhoneNumberId: "willshop_pilot",
  });

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
          : c.external_conversation_id || "Prospect WhatsApp";
        const custPhone = c.customers?.phone || c.external_conversation_id || "Non spécifié";

        return {
          id: c.id,
          customerId: c.customer_id,
          customerName: custName || "Prospect WhatsApp",
          phoneNumber: custPhone,
          status: c.status || "OPEN",
          conversationMode: c.conversation_mode || "AI_ACTIVE",
          assignedAgent: c.assigned_agent || "SALES_AI",
          unreadCount: c.unread_count || 0,
          updatedAt: c.last_message_at
            ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
          isTest: custName.includes("Test") || custPhone === "22670001122" || custPhone === "22670009999",
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
          status: m.status || "SENT",
          errorCode: m.error_code,
          externalMessageId: m.external_message_id,
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

  // Real-time Supabase Subscription for new Inbound messages
  useEffect(() => {
    if (!organizationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("realtime-whatsapp-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          if (selectedConv && newMsg.conversation_id === selectedConv.id) {
            setMessages((prev) => [
              ...prev,
              {
                id: newMsg.id,
                senderType: newMsg.sender_type,
                direction: newMsg.direction,
                content: newMsg.content || "",
                status: newMsg.status || "SENT",
                errorCode: newMsg.error_code,
                externalMessageId: newMsg.external_message_id,
                time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          }
          loadHubData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, selectedConv]);

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
            if (data.qrCode?.base64) setQrBase64(data.qrCode.base64);
            if (data.qrCode?.code) setQrCodeText(data.qrCode.code);
            if (data.qrCode?.pairingCode) setQrPairingCode(data.qrCode.pairingCode);
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
      if (data.qrCode?.base64) setQrBase64(data.qrCode.base64);
      if (data.qrCode?.code) setQrCodeText(data.qrCode.code);
      if (data.qrCode?.pairingCode) setQrPairingCode(data.qrCode.pairingCode);
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

  // Open Toggle AI confirmation modal
  const openToggleAiModal = (conv: any) => {
    const isAiActive = conv.conversationMode === "AI_ACTIVE";
    if (isAiActive) {
      setConfirmModal({
        isOpen: true,
        type: "TOGGLE_AI",
        convId: conv.id,
        convName: conv.customerName,
        targetMode: "HUMAN_ACTIVE",
        title: "Passer cette conversation en mode humain ?",
        message: "Passer cette conversation en mode humain ? L'Agent IA cessera automatiquement de répondre.",
        warningText: "Un conseiller commercial prendra la main sur cette discussion.",
        confirmText: "Confirmer (Mode Humain)",
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: "TOGGLE_AI",
        convId: conv.id,
        convName: conv.customerName,
        targetMode: "AI_ACTIVE",
        title: "Réactiver l'Agent IA ?",
        message: "Réactiver l'Agent IA pour cette conversation ? L'Agent IA répondra aux prochains messages entrants de ce client.",
        warningText: "L'IA ne répond pas immédiatement, mais répondra au prochain message du client.",
        confirmText: "Réactiver l'IA",
      });
    }
  };

  // Open Soft Delete / Archiving Modal
  const openDeleteOrArchiveModal = (conv: any, action: "SOFT_DELETE" | "ARCHIVE") => {
    setOpenMenuConvId(null);
    if (action === "SOFT_DELETE") {
      setConfirmModal({
        isOpen: true,
        type: "SOFT_DELETE",
        convId: conv.id,
        convName: conv.customerName,
        targetStatus: "ARCHIVED",
        title: "Supprimer cette conversation de WILLShop OS ?",
        message: "Êtes-vous sûr de vouloir masquer cette discussion dans WILLShop OS ?",
        warningText: "Cela supprime/masque la conversation dans le SaaS. Cela ne supprime PAS la conversation du téléphone WhatsApp.",
        confirmText: "Supprimer du SaaS",
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: "ARCHIVE",
        convId: conv.id,
        convName: conv.customerName,
        targetStatus: "ARCHIVED",
        title: "Archiver la conversation ?",
        message: "La conversation sera déplacée dans l'onglet Archivées.",
        warningText: "Vous pourrez la retrouver à tout moment dans l'onglet Archivées.",
        confirmText: "Archiver",
      });
    }
  };

  // Open Pause or Escalate Modal
  const openModeModal = (conv: any, mode: "PAUSED" | "ESCALATED") => {
    setOpenMenuConvId(null);
    if (mode === "PAUSED") {
      setConfirmModal({
        isOpen: true,
        type: "PAUSE",
        convId: conv.id,
        convName: conv.customerName,
        targetMode: "PAUSED",
        title: "Mettre en Pause la conversation ?",
        message: "Aucune réponse automatique ne sera envoyée tant que la pause est active.",
        confirmText: "Mettre en Pause",
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: "ESCALATED",
        convId: conv.id,
        convName: conv.customerName,
        targetMode: "ESCALATED",
        title: "Escalader la conversation ?",
        message: "Cette discussion sera marquée comme escaladée nécessitant l'intervention urgente d'un responsable.",
        confirmText: "Escalader",
      });
    }
  };

  // Execute Action from Confirmation Modal
  const handleExecuteModalAction = async () => {
    if (!confirmModal) return;

    try {
      const supabase = createClient();
      const { convId, targetMode, targetStatus, type } = confirmModal;

      if (targetMode) {
        await supabase
          .from("conversations")
          .update({
            conversation_mode: targetMode,
            assigned_agent: targetMode === "AI_ACTIVE" ? "SALES_AI" : "HUMAN",
          })
          .eq("id", convId);

        showToast(
          targetMode === "AI_ACTIVE"
            ? "🟢 Agent IA réactivé pour cette discussion"
            : targetMode === "HUMAN_ACTIVE"
            ? "👤 Main prise par le commercial humain"
            : targetMode === "PAUSED"
            ? "⏸️ Discussion mise en pause"
            : "🔴 Discussion escaladée"
        );
      }

      if (targetStatus) {
        await supabase
          .from("conversations")
          .update({ status: targetStatus })
          .eq("id", convId);

        showToast(
          type === "SOFT_DELETE"
            ? "🗑️ Discussion supprimée de l'affichage SaaS"
            : "📁 Discussion archivée"
        );
      }

      await loadHubData();

      if (selectedConv?.id === convId) {
        if (targetStatus === "ARCHIVED") {
          setSelectedConv(null);
        } else if (targetMode) {
          setSelectedConv((prev: any) => ({ ...prev, conversationMode: targetMode }));
        }
      }
    } catch (err: any) {
      alert(`Erreur action: ${err.message}`);
    } finally {
      setConfirmModal(null);
    }
  };

  // Send manual message from SaaS
  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !newMessageText.trim()) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          text: newMessageText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(`Échec d'envoi : ${data.error || "Erreur serveur"}`);
        return;
      }

      setNewMessageText("");
      showToast("✓ Message envoyé sur WhatsApp avec succès !");
      await loadMessagesForConv(selectedConv.id);
      await loadHubData();
    } catch (err: any) {
      alert(`Erreur envoi message : ${err.message}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customerName.toLowerCase().includes(q);
      const matchPhone = c.phoneNumber.toLowerCase().includes(q);
      if (!matchName && !matchPhone) return false;
    }

    // 2. Filter Tab
    if (filterTab === "ACTIVE") {
      return c.status !== "ARCHIVED";
    }
    if (filterTab === "AI_ACTIVE") {
      return c.status !== "ARCHIVED" && c.conversationMode === "AI_ACTIVE";
    }
    if (filterTab === "HUMAN_ACTIVE") {
      return c.status !== "ARCHIVED" && c.conversationMode === "HUMAN_ACTIVE";
    }
    if (filterTab === "ARCHIVED") {
      return c.status === "ARCHIVED";
    }
    return true; // ALL
  });

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
                💬 Centre de Supervision Commerciale WhatsApp
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Pilotez vos discussions en temps réel avec contrôle individuel de l'IA, détection smartphone (fromMe) et prise en main humaine.
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

      {/* SEARCH AND FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#12121A] border border-[#181824] p-3 rounded-2xl">
        <div className="flex items-center gap-1 bg-[#181824] p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "ACTIVE"
                ? "bg-[#7B61FF] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Actives ({conversations.filter((c) => c.status !== "ARCHIVED").length})
          </button>
          <button
            onClick={() => setFilterTab("AI_ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "AI_ACTIVE"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🟢 IA Actives ({conversations.filter((c) => c.status !== "ARCHIVED" && c.conversationMode === "AI_ACTIVE").length})
          </button>
          <button
            onClick={() => setFilterTab("HUMAN_ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "HUMAN_ACTIVE"
                ? "bg-amber-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🟠 Humaines ({conversations.filter((c) => c.status !== "ARCHIVED" && c.conversationMode === "HUMAN_ACTIVE").length})
          </button>
          <button
            onClick={() => setFilterTab("ARCHIVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "ARCHIVED"
                ? "bg-gray-700 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📁 Archivées ({conversations.filter((c) => c.status === "ARCHIVED").length})
          </button>
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "ALL"
                ? "bg-purple-800 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Toutes ({conversations.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou numéro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181824] border border-[#282838] rounded-xl pl-9 pr-3 py-1.5 text-white text-xs focus:border-[#7B61FF] outline-none"
          />
        </div>
      </div>

      {/* CONVERSATIONS & CHAT INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
        {/* CONVERSATIONS LIST */}
        <div className="bg-[#12121A] border border-[#181824] rounded-2xl p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">Discussions ({filteredConversations.length})</h3>
            <button
              onClick={loadHubData}
              className="p-1.5 text-gray-400 hover:text-white bg-[#181824] rounded-lg border border-white/5"
              title="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-12">
                Aucune discussion trouvée.
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border relative group ${
                    selectedConv?.id === conv.id
                      ? "bg-[#7B61FF]/10 border-[#7B61FF]/40 text-white"
                      : "bg-[#181824]/50 border-transparent hover:bg-[#181824] text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate max-w-[140px]">{conv.customerName}</span>

                    <div className="flex items-center gap-1.5">
                      {/* BADGE INDICATOR */}
                      {conv.conversationMode === "AI_ACTIVE" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          🟢 IA Active
                        </span>
                      )}
                      {conv.conversationMode === "HUMAN_ACTIVE" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          🟠 Humain
                        </span>
                      )}
                      {conv.conversationMode === "PAUSED" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          ⏸️ Pause
                        </span>
                      )}
                      {conv.conversationMode === "ESCALATED" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-red-500/10 text-red-400 border border-red-500/30">
                          🔴 Escaladée
                        </span>
                      )}

                      {/* MORE OPTIONS DROPDOWN */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuConvId(openMenuConvId === conv.id ? null : conv.id);
                          }}
                          className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuConvId === conv.id && (
                          <div className="absolute right-0 top-6 z-50 bg-[#181824] border border-[#282838] rounded-xl shadow-2xl py-1.5 w-48 text-xs text-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuConvId(null);
                                openToggleAiModal(conv);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-[#7B61FF]/20 flex items-center gap-2"
                            >
                              <Bot className="w-3.5 h-3.5 text-[#7B61FF]" />
                              {conv.conversationMode === "AI_ACTIVE" ? "Désactiver l'IA" : "Réactiver l'IA"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModeModal(conv, "PAUSED");
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-blue-500/20 flex items-center gap-2"
                            >
                              <PauseCircle className="w-3.5 h-3.5 text-blue-400" />
                              Mettre en Pause
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModeModal(conv, "ESCALATED");
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 flex items-center gap-2"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                              Escalader
                            </button>
                            <div className="my-1 border-t border-white/10" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteOrArchiveModal(conv, "ARCHIVE");
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-700/50 flex items-center gap-2"
                            >
                              <Archive className="w-3.5 h-3.5 text-gray-400" />
                              Archiver
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteOrArchiveModal(conv, "SOFT_DELETE");
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              Supprimer du SaaS
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400 font-mono">{conv.phoneNumber}</p>
                    <span className="text-[10px] text-gray-500 font-mono">{conv.updatedAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CHAT MESSAGES PANEL */}
        <div className="lg:col-span-2 bg-[#12121A] border border-[#181824] rounded-2xl p-4 flex flex-col h-full">
          {selectedConv ? (
            <>
              {/* CHAT HEADER */}
              <div className="flex items-center justify-between border-b border-[#181824] pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {selectedConv.customerName}
                    {selectedConv.conversationMode === "AI_ACTIVE" && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        🟢 IA ACTIVE
                      </span>
                    )}
                    {selectedConv.conversationMode === "HUMAN_ACTIVE" && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        🟠 MODE HUMAIN
                      </span>
                    )}
                    {selectedConv.conversationMode === "PAUSED" && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        ⏸️ EN PAUSE
                      </span>
                    )}
                    {selectedConv.conversationMode === "ESCALATED" && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                        🔴 ESCALADÉE
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">{selectedConv.phoneNumber}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openToggleAiModal(selectedConv)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      selectedConv.conversationMode === "AI_ACTIVE"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {selectedConv.conversationMode === "AI_ACTIVE" ? "🤖 Désactiver l'IA" : "🤖 Réactiver l'IA"}
                  </button>

                  <button
                    onClick={() => openDeleteOrArchiveModal(selectedConv, "SOFT_DELETE")}
                    className="p-1.5 text-gray-400 hover:text-red-400 bg-[#181824] rounded-xl border border-white/5"
                    title="Supprimer la conversation de WILLShop OS"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MESSAGES LIST */}
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
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 font-mono">
                      <span>{msg.senderType}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                      {msg.direction === "OUTBOUND" && (
                        <>
                          <span>•</span>
                          {msg.status === "SENT" && (
                            <span className="text-gray-400 flex items-center gap-0.5" title="Envoyé via Evolution API">
                              <Check className="w-3 h-3 text-emerald-400" />
                              SENT
                            </span>
                          )}
                          {msg.status === "DELIVERED" && (
                            <span className="text-emerald-400 flex items-center gap-0.5" title="Reçu sur WhatsApp">
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                              DELIVERED
                            </span>
                          )}
                          {msg.status === "READ" && (
                            <span className="text-blue-400 flex items-center gap-0.5" title="Lu sur WhatsApp">
                              <CheckCheck className="w-3 h-3 text-blue-400" />
                              READ
                            </span>
                          )}
                          {msg.status === "FAILED" && (
                            <span className="text-red-400 flex items-center gap-0.5" title={msg.errorCode || "Échec d'envoi"}>
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              FAILED
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CHAT INPUT BAR */}
              <form onSubmit={handleSendManualMessage} className="flex items-center gap-2 pt-2 border-t border-[#181824]">
                <input
                  type="text"
                  placeholder="Écrire un message en direct sur WhatsApp..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 bg-[#181824] border border-[#282838] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#7B61FF] outline-none"
                  disabled={isSendingMessage}
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !newMessageText.trim()}
                  className="px-4 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Sélectionnez une discussion WhatsApp pour afficher les messages.
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL (TOGGLE AI / SOFT DELETE / ARCHIVE / MODES) */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] w-full max-w-md p-6 rounded-2xl space-y-4 relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {confirmModal.type === "SOFT_DELETE" ? (
                <Trash2 className="w-5 h-5 text-red-400" />
              ) : (
                <Bot className="w-5 h-5 text-[#7B61FF]" />
              )}
              {confirmModal.title}
            </h3>

            <p className="text-sm text-gray-300">{confirmModal.message}</p>

            {confirmModal.warningText && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{confirmModal.warningText}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-700 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteModalAction}
                className={`px-5 py-2 text-white rounded-xl text-xs font-semibold transition-all ${
                  confirmModal.type === "SOFT_DELETE"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-[#7B61FF] hover:bg-[#684DFE]"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT FORM MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Connecter une Ligne WhatsApp</h3>
            <form onSubmit={handleStartEvolutionConnect} className="space-y-4">
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

              <div className="p-3 bg-[#7B61FF]/10 border border-[#7B61FF]/20 rounded-xl text-xs text-gray-300 space-y-1">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#7B61FF]" />
                  Connexion par QR Code Evolution API
                </p>
                <p>
                  Le système va créer votre instance privée sécurisée et générer un QR Code unique à scanner depuis WhatsApp Business sur votre smartphone.
                </p>
              </div>

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
                  <QrCode className="w-4 h-4" />
                  Générer le QR Code
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
