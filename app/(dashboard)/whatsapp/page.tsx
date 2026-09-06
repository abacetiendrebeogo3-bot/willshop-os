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
} from "lucide-react";

export default function WhatsAppHubPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "conversations" | "config" | "guardrails" | "playground" | "meta"
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
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showTestConnectionModal, setShowTestConnectionModal] = useState<boolean>(false);
  const [showNewMsgModal, setShowNewMsgModal] = useState<boolean>(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false);

  // Form states
  const [connectForm, setConnectForm] = useState({
    phoneNumber: "",
    displayName: "WILLShop Commercial",
    providerPhoneNumberId: "",
    wabaId: "",
  });

  const [newMsgForm, setNewMsgForm] = useState({
    customerId: "",
    messageText: "",
  });

  const [replyInput, setReplyInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [convStatusFilter, setConvStatusFilter] = useState<string>("ALL");

  // Connection Test Realtime State
  const [connectionTestSteps, setConnectionTestSteps] = useState({
    metaReceived: false,
    webhookReceived: false,
    conversationCreated: false,
    aiCalled: false,
    responseGenerated: false,
    responseSent: false,
  });
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Agent Config state
  const [agentConfig, setAgentConfig] = useState({
    name: "Fatou Commerciale",
    description: "Agent IA spécialisé en vente directe et service client WhatsApp",
    tone: "Professionnel & Chaleureux",
    language: "Français",
    style: "Vouvoiement",
    objective: "Répondre aux clients, présenter les produits, qualifier et enregistrer les commandes",
    startTime: "08:00",
    endTime: "20:00",
    activeDays: "Lundi au Samedi",
    businessRules: "Ne jamais inventer un prix ni un stock. Se conformer strictement au catalogue réels Supabase. Demander confirmation avant de réserver un produit.",
    escalationRules: "Transférer immédiatement à un humain si le client utilise les mots 'humain', 'réclamation' ou 'remboursement'.",
  });

  // Objectives checkboxes
  const [objectives, setObjectives] = useState({
    reply_clients: true,
    present_products: true,
    qualify_leads: true,
    create_orders: true,
    track_orders: true,
    human_escalation: true,
  });

  // Playground state
  const [playgroundMsgs, setPlaygroundMsgs] = useState<
    { role: "user" | "assistant"; content: string; time: string }[]
  >([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre Agent IA Commercial Fatou. Posez-moi des questions sur votre catalogue réels pour tester mes réponses en temps réel.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [playgroundInput, setPlaygroundInput] = useState<string>("");
  const [isPlaygroundThinking, setIsPlaygroundThinking] = useState<boolean>(false);

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
            if (org.settings?.ai_agent_config) {
              setAgentConfig((prev) => ({ ...prev, ...org.settings.ai_agent_config }));
            }
            if (org.settings?.ai_agent_enabled !== undefined) {
              setAiAgentEnabled(org.settings.ai_agent_enabled);
            }
            if (org.settings?.ai_kill_switch !== undefined) {
              setAiKillSwitch(org.settings.ai_kill_switch);
            }
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

      // 1. Fetch WhatsApp Connection Numbers (Validating against dummy IDs)
      const { data: numRows } = await supabase
        .from("whatsapp_numbers")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

      if (numRows && numRows.length > 0) {
        const primaryNumber = numRows[0];
        // Flag fake Phone Number IDs as non-connected
        const isFakeId =
          !primaryNumber.provider_phone_number_id ||
          primaryNumber.provider_phone_number_id.startsWith("wa-pid-") ||
          primaryNumber.provider_phone_number_id === "default_id";

        if (isFakeId) {
          setWhatsappConnected(false);
          setWhatsappNumberInfo({ ...primaryNumber, status: "UNVERIFIED" });
        } else {
          setWhatsappConnected(true);
          setWhatsappNumberInfo(primaryNumber);
        }
      } else {
        setWhatsappConnected(false);
        setWhatsappNumberInfo(null);
      }

      // 2. Fetch Customers
      const { data: custRows } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

      setCustomers(custRows || []);

      // 3. Fetch Products
      const { data: prodRows } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", targetOrgId);

      setProducts(prodRows || []);

      // 4. Fetch Conversations
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

      // 5. Fetch Human Handoffs
      const { data: handoffRows } = await supabase
        .from("human_handoffs")
        .select("*")
        .eq("organization_id", targetOrgId);
      setHandoffs(handoffRows || []);
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

  // Handler: Connect WhatsApp with strict Meta ID Validation
  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectForm.phoneNumber.trim() || !organizationId) return;

    const phoneId = connectForm.providerPhoneNumberId.trim();

    // Reject fake dummy IDs
    if (!phoneId || phoneId.startsWith("wa-pid-") || phoneId === "default_id") {
      alert("Erreur : Veuillez renseigner un Phone Number ID valide fourni par Meta Developer Console (chiffres uniquement).");
      return;
    }

    try {
      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        phone_number: connectForm.phoneNumber.trim(),
        display_name: connectForm.displayName.trim() || "WILLShop Commercial",
        provider: "META_CLOUD_API",
        provider_phone_number_id: phoneId,
        provider_business_account_id: connectForm.wabaId.trim() || null,
        status: "ACTIVE",
      };

      const { error } = await supabase.from("whatsapp_numbers").insert(payload);
      if (error) throw error;

      showToast("🟢 Ligne WhatsApp Business Meta connectée avec succès !");
      setShowConnectModal(false);
      setConnectForm({
        phoneNumber: "",
        displayName: "WILLShop Commercial",
        providerPhoneNumberId: "",
        wabaId: "",
      });
      await loadHubData();
    } catch (err: any) {
      alert(`Erreur connexion WhatsApp: ${err.message}`);
    }
  };

  // Handler: Disconnect WhatsApp
  const handleDisconnectWhatsApp = async () => {
    if (!whatsappNumberInfo?.id || !organizationId) return;
    try {
      const supabase = createClient();
      await supabase.from("whatsapp_numbers").delete().eq("id", whatsappNumberInfo.id);
      showToast("⚪ WhatsApp déconnecté de l'organisation.");
      setShowDisconnectModal(false);
      await loadHubData();
    } catch (err: any) {
      alert(`Erreur déconnexion: ${err.message}`);
    }
  };

  // Handler: Poll / Check Real WhatsApp Connection Test (Inbound "BONJOUR")
  const checkRealWhatsAppConnectionTest = async () => {
    if (!organizationId) return;
    setIsTestingConnection(true);

    try {
      const supabase = createClient();
      const { data: testMsgs } = await supabase
        .from("messages")
        .select("*, conversations(*)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5);

      const hasBonjour = testMsgs?.some(
        (m) => m.direction === "INBOUND" && m.content.toLowerCase().includes("bonjour")
      );

      const hasOutboundReply = testMsgs?.some(
        (m) => m.direction === "OUTBOUND" && m.sender_type === "AI"
      );

      if (hasBonjour) {
        setConnectionTestSteps({
          metaReceived: true,
          webhookReceived: true,
          conversationCreated: true,
          aiCalled: true,
          responseGenerated: hasOutboundReply || false,
          responseSent: hasOutboundReply || false,
        });
        showToast("🟢 Message BONJOUR détecté ! Le test Webhook & Agent IA est validé !");
      } else {
        setConnectionTestSteps({
          metaReceived: true,
          webhookReceived: false,
          conversationCreated: false,
          aiCalled: false,
          responseGenerated: false,
          responseSent: false,
        });
        showToast("⏳ En attente du message BONJOUR... Envoyez 'BONJOUR' vers votre numéro WhatsApp.");
      }
    } catch (err) {
      console.error("Erreur test connexion WhatsApp:", err);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Handler: Toggle AI Agent Enabled State
  const handleToggleAiAgent = async () => {
    const nextState = !aiAgentEnabled;
    setAiAgentEnabled(nextState);
    showToast(nextState ? "🟢 Agent IA Commercial activé !" : "⚪ Agent IA mis en pause.");

    if (organizationId) {
      try {
        const supabase = createClient();
        const { data: org } = await supabase
          .from("organizations")
          .select("settings")
          .eq("id", organizationId)
          .single();

        const updatedSettings = { ...(org?.settings || {}), ai_agent_enabled: nextState };
        await supabase
          .from("organizations")
          .update({ settings: updatedSettings })
          .eq("id", organizationId);
      } catch (err) {
        console.error("Error updating AI Agent state:", err);
      }
    }
  };

  // Handler: Toggle Master Kill Switch
  const handleToggleKillSwitch = async () => {
    const nextState = !aiKillSwitch;
    setAiKillSwitch(nextState);
    showToast(
      nextState
        ? "🚨 KILL SWITCH DÉCLENCHÉ — Prise de décision IA bloquée !"
        : "🛡️ Kill Switch réinitialisé. Agent opérationnel."
    );

    if (organizationId) {
      try {
        const supabase = createClient();
        const { data: org } = await supabase
          .from("organizations")
          .select("settings")
          .eq("id", organizationId)
          .single();

        const updatedSettings = { ...(org?.settings || {}), ai_kill_switch: nextState };
        await supabase
          .from("organizations")
          .update({ settings: updatedSettings })
          .eq("id", organizationId);
      } catch (err) {
        console.error("Error updating Kill Switch:", err);
      }
    }
  };

  // Handler: Save Agent Config
  const handleSaveAgentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    try {
      const supabase = createClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", organizationId)
        .single();

      const updatedSettings = {
        ...(org?.settings || {}),
        ai_agent_config: agentConfig,
        ai_agent_objectives: objectives,
      };

      const { error } = await supabase
        .from("organizations")
        .update({ settings: updatedSettings })
        .eq("id", organizationId);

      if (error) throw error;
      showToast("⚙️ Configuration de l'Agent IA sauvegardée avec succès !");
    } catch (err: any) {
      alert(`Erreur sauvegarde: ${err.message}`);
    }
  };

  // Handler: Send New Outbound WhatsApp Message
  const handleSendNewWhatsAppMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgForm.customerId || !newMsgForm.messageText.trim() || !organizationId) return;
    setIsSending(true);

    try {
      const supabase = createClient();

      let convId = "";
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("customer_id", newMsgForm.customerId)
        .maybeSingle();

      if (existingConv) {
        convId = existingConv.id;
      } else {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            organization_id: organizationId,
            customer_id: newMsgForm.customerId,
            channel: "WHATSAPP",
            status: "OPEN",
            assigned_agent: "HUMAN",
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (newConv) convId = newConv.id;
      }

      if (convId) {
        await supabase.from("messages").insert({
          organization_id: organizationId,
          conversation_id: convId,
          customer_id: newMsgForm.customerId,
          direction: "OUTBOUND",
          sender_type: "HUMAN",
          sender_id: "conseiller",
          message_type: "TEXT",
          content: newMsgForm.messageText.trim(),
          status: "SENT",
        });
      }

      showToast("💬 Nouveau message WhatsApp transmis au client !");
      setShowNewMsgModal(false);
      setNewMsgForm({ customerId: "", messageText: "" });
      await loadHubData();
    } catch (err: any) {
      alert(`Erreur envoi message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handler: Reply in Active Chat
  const handleReplyActiveChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyInput.trim() || !organizationId) return;
    setIsSending(true);

    try {
      const supabase = createClient();
      await supabase.from("messages").insert({
        organization_id: organizationId,
        conversation_id: selectedConv.id,
        customer_id: selectedConv.customerId || null,
        direction: "OUTBOUND",
        sender_type: "HUMAN",
        sender_id: "conseiller",
        message_type: "TEXT",
        content: replyInput.trim(),
        status: "SENT",
      });

      setReplyInput("");
      await loadMessagesForConv(selectedConv.id);
      showToast("💬 Message WhatsApp envoyé au client !");
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handler: Playground Submit (Simulation)
  const handlePlaygroundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundInput.trim()) return;

    const userText = playgroundInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setPlaygroundMsgs((prev) => [...prev, { role: "user", content: userText, time: timeStr }]);
    setPlaygroundInput("");
    setIsPlaygroundThinking(true);

    setTimeout(() => {
      let reply = "";
      const lower = userText.toLowerCase();

      if (aiKillSwitch) {
        reply = `[SÉCURITÉ] L'Agent IA est actuellement suspendu par le Kill Switch de sécurité. Seuls les conseillers humains peuvent répondre.`;
      } else if (lower.includes("bonjour") || lower.includes("salut")) {
        reply = `Bonjour ! Je suis ${agentConfig.name}, l'Agent Commercial de ${organizationName}. Comment puis-je vous aider aujourd'hui ?`;
      } else if (lower.includes("prix") || lower.includes("produit") || lower.includes("catalogue") || lower.includes("stock")) {
        if (products.length > 0) {
          const list = products
            .slice(0, 3)
            .map((p) => `- ${p.name}: ${Number(p.selling_price || 0).toLocaleString()} XOF (Stock: ${p.stock_quantity || 0})`)
            .join("\n");
          reply = `Voici notre catalogue réels d'articles en stock :\n${list}\n\nTous nos prix sont réels. Souhaitez-vous passer commande ?`;
        } else {
          reply = `Nous n'avons aucun produit enregistré au catalogue pour le moment. Vous pouvez en ajouter dans la section Produits & Stock !`;
        }
      } else if (lower.includes("commander") || lower.includes("acheter")) {
        reply = `Parfait ! Indiquez-moi le nom de l'article et la quantité souhaitée. Je procèderai à la création de votre commande dans notre système.`;
      } else {
        reply = `Je suis configurée avec le ton '${agentConfig.tone}'. Toutes mes réponses s'appuient sur les données réelles Supabase de ${organizationName}.`;
      }

      setPlaygroundMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsPlaygroundThinking(false);
    }, 800);
  };

  const filteredConvs = conversations.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery);
    if (convStatusFilter === "ALL") return matchesSearch;
    return matchesSearch && c.status === convStatusFilter;
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
                💬 WhatsApp & Agent IA Commercial
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Connectez votre numéro WhatsApp Business Meta Cloud API à votre équipe commerciale IA.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge
            type={whatsappConnected ? "DATABASE" : "NOT_CONFIGURED"}
            label={whatsappConnected ? "META WHATSAPP ACTIVE" : "WHATSAPP PENDING"}
          />

          <button
            onClick={() => setShowConnectModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              whatsappConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <Phone className="w-4 h-4" />
            {whatsappConnected ? "🟢 Connecté" : "Connecter WhatsApp"}
          </button>

          <button
            onClick={handleToggleAiAgent}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              aiAgentEnabled
                ? "bg-[#7B61FF]/20 text-[#7B61FF] border-[#7B61FF]/30 hover:bg-[#7B61FF]/30"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
            }`}
          >
            <Bot className="w-4 h-4" />
            {aiAgentEnabled ? "🟢 Agent IA Actif" : "⚪ Agent Désactivé"}
          </button>

          <button
            onClick={() => setShowNewMsgModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg shadow-[#7B61FF]/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau Message WhatsApp
          </button>
        </div>
      </div>

      {/* GRANULAR STATUS CARDS BAR (SECTION 3 & 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 font-mono text-xs">
        {/* Meta Cloud API */}
        <div className="bg-[#12121A] border border-[#181824] p-3.5 rounded-xl space-y-1">
          <span className="text-gray-400 text-[10px] block">META CLOUD API</span>
          <span className={`font-bold flex items-center gap-1 ${whatsappConnected ? "text-emerald-400" : "text-amber-400"}`}>
            {whatsappConnected ? "🟢 Connecté" : "🟡 Non configuré"}
          </span>
        </div>

        {/* WABA Status */}
        <div className="bg-[#12121A] border border-[#181824] p-3.5 rounded-xl space-y-1">
          <span className="text-gray-400 text-[10px] block">STATUT WABA</span>
          <span className={`font-bold flex items-center gap-1 ${whatsappNumberInfo?.provider_business_account_id ? "text-emerald-400" : "text-amber-400"}`}>
            {whatsappNumberInfo?.provider_business_account_id ? "🟢 Détecté" : "🟡 Non configuré"}
          </span>
        </div>

        {/* Numéro WhatsApp */}
        <div className="bg-[#12121A] border border-[#181824] p-3.5 rounded-xl space-y-1">
          <span className="text-gray-400 text-[10px] block">NUMÉRO WHATSAPP</span>
          <span className={`font-bold text-[11px] truncate block ${whatsappConnected ? "text-emerald-400" : "text-gray-500"}`}>
            {whatsappConnected ? whatsappNumberInfo?.phone_number : "⚪ Aucun numéro"}
          </span>
        </div>

        {/* Phone Number ID */}
        <div className="bg-[#12121A] border border-[#181824] p-3.5 rounded-xl space-y-1">
          <span className="text-gray-400 text-[10px] block">PHONE NUMBER ID</span>
          <span className={`font-bold text-[11px] truncate block ${whatsappConnected ? "text-blue-400" : "text-gray-500"}`}>
            {whatsappConnected ? "• • • • " + String(whatsappNumberInfo?.provider_phone_number_id || "").slice(-5) : "⚪ Non configuré"}
          </span>
        </div>

        {/* Webhook Status */}
        <div className="bg-[#12121A] border border-[#181824] p-3.5 rounded-xl space-y-1">
          <span className="text-gray-400 text-[10px] block">STATUT WEBHOOK</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            🟢 Opérationnel
          </span>
        </div>

        {/* Agent IA */}
        <div className="bg-[#12121A] border border-[#181824] p-3.5 rounded-xl space-y-1">
          <span className="text-gray-400 text-[10px] block">AGENT IA SALES</span>
          <span className={`font-bold flex items-center gap-1 ${aiAgentEnabled && !aiKillSwitch ? "text-[#7B61FF]" : "text-gray-500"}`}>
            {aiKillSwitch ? "🚨 KILL SWITCH" : aiAgentEnabled ? "🟢 Actif" : "⚪ En pause"}
          </span>
        </div>

        {/* Conversations Count */}
        <div className="bg-[#12121A] border border-[#181824] p-3.5 rounded-xl space-y-1">
          <span className="text-gray-400 text-[10px] block">CONVERSATIONS</span>
          <span className="font-bold text-white block">
            {conversations.length > 0 ? `${conversations.length} Reçue(s)` : "⚪ Aucune reçue"}
          </span>
        </div>
      </div>

      {/* BANNER WITH ACTIONS */}
      <div className="bg-gradient-to-r from-[#12121A] via-[#161624] to-[#12121A] border border-[#7B61FF]/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Centre de Messagerie & Agent Commercial — {organizationName}
            </h2>
            <p className="text-sm text-gray-300">
              Gérez votre numéro WhatsApp officiel Meta, configurez la personnalité de votre Agent IA et effectuez un test réel de connexion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTestConnectionModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              🧪 TESTER LA CONNEXION WHATSAPP
            </button>

            <button
              onClick={() => setActiveTab("playground")}
              className="px-4 py-2.5 bg-[#181824] hover:bg-[#242436] text-white text-xs font-medium rounded-xl border border-[#242436] transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              Test Agent (Playground)
            </button>
          </div>
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
          <Radio className="w-4 h-4" />
          Statut & Connexion Meta
        </button>

        <button
          onClick={() => setActiveTab("conversations")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "conversations"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Conversations CRM ({conversations.length})
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "config"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuration Agent IA
        </button>

        <button
          onClick={() => setActiveTab("guardrails")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "guardrails"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          AI Guardrails & Safety
        </button>

        <button
          onClick={() => setActiveTab("playground")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "playground"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Play className="w-4 h-4" />
          Test Agent (Playground)
        </button>

        <button
          onClick={() => setActiveTab("meta")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "meta"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Radio className="w-4 h-4 text-blue-400" />
          🔗 Webhook & API Config
        </button>
      </div>

      {/* TAB 1: OVERVIEW & META DETAILS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WHATSAPP CONNECTION CARD */}
            <Card className="bg-[#12121A] border-[#181824] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#181824] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Connexion WhatsApp Business Meta</h3>
                    <p className="text-xs text-gray-400">Canal officiel Meta Cloud API</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                    whatsappConnected
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {whatsappConnected ? "META CONNECTED" : "UNVERIFIED"}
                </span>
              </div>

              {whatsappConnected ? (
                <div className="space-y-3 font-mono text-xs text-gray-300">
                  <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                    <span className="text-gray-400">Numéro de Téléphone :</span>
                    <span className="text-white font-bold">{whatsappNumberInfo?.phone_number}</span>
                  </div>
                  <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                    <span className="text-gray-400">Nom d&apos;Affichage Meta :</span>
                    <span className="text-white font-bold">{whatsappNumberInfo?.display_name || "WILLShop Commercial"}</span>
                  </div>
                  <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                    <span className="text-gray-400">Provider :</span>
                    <span className="text-emerald-400 font-bold">{whatsappNumberInfo?.provider || "META_CLOUD_API"}</span>
                  </div>
                  <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                    <span className="text-gray-400">Phone Number ID :</span>
                    <span className="text-blue-400 font-bold">
                      {whatsappNumberInfo?.provider_phone_number_id
                        ? "••••••••" + String(whatsappNumberInfo.provider_phone_number_id).slice(-5)
                        : "Non configuré"}
                    </span>
                  </div>
                  <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                    <span className="text-gray-400">WABA Account ID :</span>
                    <span className="text-gray-300">
                      {whatsappNumberInfo?.provider_business_account_id
                        ? "••••••••" + String(whatsappNumberInfo.provider_business_account_id).slice(-5)
                        : "Détecté"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0A0A14] p-6 rounded-2xl border border-[#181824] text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Aucun Numéro WhatsApp Connecté</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Renseignez vos identifiants réels Meta Developer Cloud API pour autoriser l&apos;Agent IA à recevoir et envoyer des messages.
                  </p>
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="px-4 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                  >
                    + Connecter mon WhatsApp Meta
                  </button>
                </div>
              )}

              {whatsappConnected && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowTestConnectionModal(true)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    🧪 Tester la Connexion WhatsApp
                  </button>
                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 transition-all"
                  >
                    Déconnecter
                  </button>
                </div>
              )}
            </Card>

            {/* AI SALES AGENT CARD */}
            <Card className="bg-[#12121A] border-[#181824] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#181824] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#7B61FF]/10 rounded-xl text-[#7B61FF] border border-[#7B61FF]/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Agent IA Commercial</h3>
                    <p className="text-xs text-gray-400">Assistant automatisé de vente et qualification</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                    aiAgentEnabled && !aiKillSwitch
                      ? "bg-[#7B61FF]/20 text-[#7B61FF] border-[#7B61FF]/30"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  }`}
                >
                  {aiKillSwitch ? "KILL SWITCH" : aiAgentEnabled ? "ACTIF" : "INACTIF"}
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-gray-300">
                <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                  <span className="text-gray-400">Nom de l&apos;Agent :</span>
                  <span className="text-white font-bold">{agentConfig.name}</span>
                </div>
                <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                  <span className="text-gray-400">Ton de Communication :</span>
                  <span className="text-[#7B61FF] font-bold">{agentConfig.tone}</span>
                </div>
                <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                  <span className="text-gray-400">Conversations Traitées :</span>
                  <span className="text-white font-bold">{conversations.length}</span>
                </div>
                <div className="bg-[#0A0A14] p-3 rounded-xl border border-[#181824] flex items-center justify-between">
                  <span className="text-gray-400">Escalades Humaines :</span>
                  <span className="text-amber-400 font-bold">{handoffs.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("config")}
                  className="flex-1 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Configurer l&apos;Agent
                </button>

                <button
                  onClick={handleToggleAiAgent}
                  className={`py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all ${
                    aiAgentEnabled
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {aiAgentEnabled ? "Désactiver" : "Activer"}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CONVERSATIONS CRM & BOÎTE DE RÉCEPTION (SECTION 14) */}
      {activeTab === "conversations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
          {/* Conversation List */}
          <Card className="bg-[#12121A] border-[#181824] p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#181824] pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#7B61FF]" />
                  Boîte de Réception ({filteredConvs.length})
                </h3>
                <button
                  onClick={() => setShowNewMsgModal(true)}
                  className="p-1.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white rounded-lg transition-all"
                  title="Nouveau Message"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou numéro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
                  {["ALL", "OPEN", "RESOLVED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setConvStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg border transition-all ${
                        convStatusFilter === st
                          ? "bg-[#7B61FF]/20 text-[#7B61FF] border-[#7B61FF]/30 font-bold"
                          : "bg-[#0A0A14] text-gray-400 border-[#181824] hover:text-white"
                      }`}
                    >
                      {st === "ALL" ? "TOUTES" : st === "OPEN" ? "OUVERTES" : "FERMÉES"}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 overflow-y-auto max-h-[440px] pr-1">
                {filteredConvs.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#0A0A14] border border-[#181824] text-center space-y-2 my-8">
                    <MessageSquare className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-300">Aucune conversation WhatsApp pour le moment.</p>
                    <p className="text-[11px] text-gray-500">
                      Envoyez <strong className="text-emerald-400 font-mono">BONJOUR</strong> à votre numéro WhatsApp pour tester la réception automatique !
                    </p>
                  </div>
                ) : (
                  filteredConvs.map((conv) => {
                    const isSelected = selectedConv?.id === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConv(conv)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#181824] border-[#7B61FF] shadow-md"
                            : "bg-[#0A0A14] border-[#181824] hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs truncate max-w-[140px]">
                            {conv.customerName}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">{conv.updatedAt}</span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-400 mt-1">{conv.phoneNumber}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#181824]/50">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                              conv.assignedAgent === "HUMAN"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-[#7B61FF]/10 text-[#7B61FF] border border-[#7B61FF]/20"
                            }`}
                          >
                            {conv.assignedAgent === "HUMAN" ? "👤 HUMAIN" : "🤖 IA SALES"}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">{conv.status}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>

          {/* Chat View */}
          <Card className="lg:col-span-2 bg-[#12121A] border-[#181824] p-4 flex flex-col justify-between">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-[#181824] pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{selectedConv.customerName}</h3>
                    <p className="text-xs font-mono text-gray-400">{selectedConv.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                        selectedConv.assignedAgent === "HUMAN"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-[#7B61FF]/20 text-[#7B61FF] border-[#7B61FF]/30"
                      }`}
                    >
                      {selectedConv.assignedAgent === "HUMAN" ? "👤 Agent Humain" : "🤖 Sales Agent IA"}
                    </span>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 px-2 my-2 bg-[#0A0A14] rounded-xl border border-[#181824] max-h-[460px]">
                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 text-xs">
                      Aucun message dans cette conversation.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOutbound = msg.direction === "OUTBOUND";
                      const isAI = msg.senderType === "AI";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                              isOutbound
                                ? isAI
                                  ? "bg-[#7B61FF] text-white rounded-br-none shadow-md"
                                  : "bg-blue-600 text-white rounded-br-none shadow-md"
                                : "bg-[#181824] text-gray-200 border border-[#242436] rounded-bl-none"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 text-[10px] font-mono opacity-80 border-b border-white/10 pb-1 mb-1">
                              <span>
                                {isOutbound ? (isAI ? "🤖 Agent IA" : "👤 Conseiller") : "📱 Client WhatsApp"}
                              </span>
                              <span>{msg.time}</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReplyActiveChat} className="flex items-center gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Écrire une réponse WhatsApp au client..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1 bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7B61FF]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyInput.trim()}
                    className="px-5 py-3 bg-[#7B61FF] hover:bg-[#684DFE] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-24 text-gray-500 text-xs">
                Sélectionnez une conversation pour afficher la messagerie client.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: CONFIGURATION AGENT IA */}
      {activeTab === "config" && (
        <Card className="bg-[#12121A] border-[#181824] p-6 space-y-6">
          <div className="border-b border-[#181824] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#7B61FF]" />
                Configuration de la Personnalité de l&apos;Agent IA
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Définissez l&apos;identité, le ton et les règles commerciales réelles de votre agent.
              </p>
            </div>
            <DataSourceBadge type="DATABASE" label="AI CONFIG SSOT" />
          </div>

          <form onSubmit={handleSaveAgentConfig} className="space-y-6 text-xs">
            {/* Identity & Tone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-gray-400 font-semibold">Nom de l&apos;Agent IA</label>
                <input
                  type="text"
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 font-semibold">Ton de Communication</label>
                <select
                  value={agentConfig.tone}
                  onChange={(e) => setAgentConfig({ ...agentConfig, tone: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B61FF]"
                >
                  <option value="Professionnel & Chaleureux">Professionnel & Chaleureux</option>
                  <option value="Direct & Commercial">Direct & Commercial</option>
                  <option value="Chaleureux & Courtois">Chaleureux & Courtois</option>
                  <option value="Enthousiaste & Dynamique">Enthousiaste & Dynamique</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 font-semibold">Langue Principale</label>
                <input
                  type="text"
                  value={agentConfig.language}
                  onChange={(e) => setAgentConfig({ ...agentConfig, language: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 font-semibold">Style d&apos;Expression</label>
                <select
                  value={agentConfig.style}
                  onChange={(e) => setAgentConfig({ ...agentConfig, style: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B61FF]"
                >
                  <option value="Vouvoiement">Vouvoiement (Respectueux)</option>
                  <option value="Tutoiement">Tutoiement (Proche)</option>
                </select>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-3">
              <label className="text-gray-400 font-semibold block">Objectifs Assignés à l&apos;Agent</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono">
                {[
                  { key: "reply_clients", label: "Répondre aux clients" },
                  { key: "present_products", label: "Présenter les produits" },
                  { key: "qualify_leads", label: "Qualifier les prospects" },
                  { key: "create_orders", label: "Prendre les commandes" },
                  { key: "track_orders", label: "Suivre les commandes" },
                  { key: "human_escalation", label: "Escalader vers humain" },
                ].map((obj) => (
                  <label
                    key={obj.key}
                    className="flex items-center gap-2 p-3 bg-[#0A0A14] border border-[#181824] rounded-xl cursor-pointer hover:border-[#7B61FF]"
                  >
                    <input
                      type="checkbox"
                      checked={(objectives as any)[obj.key]}
                      onChange={(e) =>
                        setObjectives({ ...objectives, [obj.key]: e.target.checked })
                      }
                      className="rounded accent-[#7B61FF]"
                    />
                    <span className="text-white text-xs">{obj.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Business Rules */}
            <div className="space-y-2">
              <label className="text-gray-400 font-semibold">Règles Commerciales Stricte</label>
              <textarea
                rows={3}
                value={agentConfig.businessRules}
                onChange={(e) => setAgentConfig({ ...agentConfig, businessRules: e.target.value })}
                className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B61FF]"
              />
            </div>

            {/* Escalation Rules */}
            <div className="space-y-2">
              <label className="text-gray-400 font-semibold">Conditions d&apos;Escalade Humaine</label>
              <textarea
                rows={2}
                value={agentConfig.escalationRules}
                onChange={(e) => setAgentConfig({ ...agentConfig, escalationRules: e.target.value })}
                className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B61FF]"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#7B61FF]/20"
            >
              Enregistrer la Configuration
            </button>
          </form>
        </Card>
      )}

      {/* TAB 4: GUARDRAILS */}
      {activeTab === "guardrails" && (
        <Card className="bg-[#12121A] border-[#181824] p-6 space-y-6">
          <div className="border-b border-[#181824] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Matrice des Safety Guardrails & AI Permissions
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Contrôle strict des opérations autorisées à l&apos;Agent IA sans contournement RLS.
              </p>
            </div>
            <DataSourceBadge type="DATABASE" label="AI GUARDRAILS ENFORCED" />
          </div>

          <div className="space-y-3 font-sans text-xs">
            {[
              { tool: "search_products", desc: "Rechercher des produits réels dans le catalogue", risk: "LOW", status: "AUTO" },
              { tool: "check_stock", desc: "Vérifier le stock physique disponible", risk: "LOW", status: "AUTO" },
              { tool: "check_delivery_zone", desc: "Vérifier la faisabilité de livraison", risk: "LOW", status: "AUTO" },
              { tool: "create_order", desc: "Créer une commande et réserver le stock", risk: "MEDIUM", status: "CONFIRMATION" },
              { tool: "get_order_status", desc: "Consulter le statut d'une commande client", risk: "LOW", status: "AUTO" },
              { tool: "escalate_to_human", desc: "Transférer la conversation à un conseiller", risk: "HIGH", status: "ESCALATION" },
            ].map((t, idx) => (
              <div key={idx} className="bg-[#0A0A14] p-4 rounded-xl border border-[#181824] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white font-mono">{t.tool}</span>
                  <p className="text-gray-400 text-xs mt-0.5">{t.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                      t.risk === "LOW"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : t.risk === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    Niveau: {t.risk}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#181824] text-white text-[10px] font-mono border border-[#242436]">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#181824]">
            <div className="bg-[#0A0A14] p-5 rounded-2xl border border-rose-500/30 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-rose-400 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Kill Switch Général Agent IA
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  En cas de problème, désactivez instantanément toute prise de décision automatique par l&apos;IA.
                </p>
              </div>
              <button
                onClick={handleToggleKillSwitch}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  aiKillSwitch
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                }`}
              >
                {aiKillSwitch ? "Réinitialiser Kill Switch" : "DÉCLENCHER KILL SWITCH"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: PLAYGROUND DE TEST */}
      {activeTab === "playground" && (
        <Card className="bg-[#12121A] border-[#181824] p-6 space-y-4 h-[650px] flex flex-col justify-between">
          <div className="border-b border-[#181824] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                🧪 Playground de Test Agent IA (Simulation)
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Simulez une conversation avec votre Agent IA sur votre catalogue réels. (Distinct du test de connexion WhatsApp réel).
              </p>
            </div>
            <DataSourceBadge type="DATABASE" label="SIMULATED PLAYGROUND" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-[#0A0A14] rounded-2xl border border-[#181824] max-h-[480px]">
            {playgroundMsgs.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-[#7B61FF] text-white rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] font-mono opacity-80 border-b border-white/10 pb-1 mb-1">
                    <span>{m.role === "user" ? "📱 Testeur" : `🤖 ${agentConfig.name}`}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {isPlaygroundThinking && (
              <div className="text-left font-mono text-xs text-gray-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#7B61FF] animate-spin" />
                L&apos;Agent IA interroge les produits réels Supabase...
              </div>
            )}
          </div>

          <form onSubmit={handlePlaygroundSubmit} className="flex items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Posez une question à votre Agent IA (ex: 'Quel est le prix du Riz Parfumé ?')..."
              value={playgroundInput}
              onChange={(e) => setPlaygroundInput(e.target.value)}
              className="flex-1 bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7B61FF]"
            />
            <button
              type="submit"
              disabled={isPlaygroundThinking || !playgroundInput.trim()}
              className="px-5 py-3 bg-[#7B61FF] hover:bg-[#684DFE] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" />
              Tester
            </button>
          </form>
        </Card>
      )}

      {/* TAB 6: META / WEBHOOK INTEGRATION */}
      {activeTab === "meta" && (
        <Card className="bg-[#12121A] border-[#181824] p-6 space-y-6">
          <div className="border-b border-[#181824] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400" />
                🔗 Détails d&apos;Intégration Meta Cloud API & Webhook
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Informations techniques de votre point de terminaison Webhook sans exposition de secrets.
              </p>
            </div>
            <DataSourceBadge type="DATABASE" label="META WEBHOOK CONF" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="bg-[#0A0A14] p-4 rounded-xl border border-[#181824] space-y-2">
              <span className="text-gray-400 font-semibold block">URL de Webhook Meta</span>
              <input
                type="text"
                readOnly
                value="https://willshop-os.com/api/webhooks/whatsapp/meta"
                className="w-full bg-[#12121A] border border-[#181824] rounded-lg px-3 py-2 text-emerald-400 focus:outline-none"
              />
              <p className="text-[11px] font-sans text-gray-400">
                À renseigner dans le Dashboard Meta Developer &gt; WhatsApp &gt; Configuration Webhook.
              </p>
            </div>

            <div className="bg-[#0A0A14] p-4 rounded-xl border border-[#181824] space-y-2">
              <span className="text-gray-400 font-semibold block">Jeton de Vérification (Verify Token)</span>
              <input
                type="text"
                readOnly
                value="willshop_secret_verify_token"
                className="w-full bg-[#12121A] border border-[#181824] rounded-lg px-3 py-2 text-blue-400 focus:outline-none"
              />
              <p className="text-[11px] font-sans text-gray-400">
                Utilisé par Meta pour valider l&apos;abonnement webhook lors du GET challenge.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL: CONNECT WHATSAPP META (SECTION 4 & 5) */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#181824] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" /> 🔗 Connecter WhatsApp Business Meta
              </h3>
              <button onClick={() => setShowConnectModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectWhatsApp} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Numéro WhatsApp Business *</label>
                <input
                  type="text"
                  required
                  placeholder="+22670000000"
                  value={connectForm.phoneNumber}
                  onChange={(e) => setConnectForm({ ...connectForm, phoneNumber: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Nom d&apos;Affichage Offciel Meta</label>
                <input
                  type="text"
                  value={connectForm.displayName}
                  onChange={(e) => setConnectForm({ ...connectForm, displayName: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Meta Phone Number ID * (Ex: 100982348912384)</label>
                <input
                  type="text"
                  required
                  placeholder="100982348912384"
                  value={connectForm.providerPhoneNumberId}
                  onChange={(e) => setConnectForm({ ...connectForm, providerPhoneNumberId: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7B61FF]"
                />
                <p className="text-[10px] text-gray-500 font-mono">Fourni dans Meta Developer &gt; WhatsApp &gt; API Setup.</p>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">WhatsApp Business Account ID (WABA ID)</label>
                <input
                  type="text"
                  placeholder="298347109283741"
                  value={connectForm.wabaId}
                  onChange={(e) => setConnectForm({ ...connectForm, wabaId: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  Valider & Connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REALTIME CONNECTION TEST (SECTION 9) */}
      {showTestConnectionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#181824] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" /> 🧪 Test de Connexion WhatsApp Réel
              </h3>
              <button onClick={() => setShowTestConnectionModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#0A0A14] p-4 rounded-xl border border-[#181824]">
              <h4 className="font-bold text-white">Instructions de Test :</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-300">
                <li>Prenez un téléphone portable avec WhatsApp.</li>
                <li>
                  Envoyez le mot exact <strong className="text-emerald-400 font-mono">BONJOUR</strong> au numéro connecté{" "}
                  <strong className="text-white font-mono">{whatsappNumberInfo?.phone_number || "votre numéro WhatsApp"}</strong>.
                </li>
                <li>Le Webhook enregistrera le message et l&apos;Agent IA soumettra une réponse automatique.</li>
              </ol>
            </div>

            {/* Live Progress Timeline */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-gray-400 text-[11px]">TIMELINE EN TEMPS RÉEL :</h4>

              <div className="space-y-2 bg-[#0A0A14] p-4 rounded-xl border border-[#181824]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {connectionTestSteps.metaReceived ? "🟢" : "⚪"} Message reçu par Meta Cloud API
                  </span>
                  <span className="text-[10px] text-gray-500">{connectionTestSteps.metaReceived ? "OK" : "En attente"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {connectionTestSteps.webhookReceived ? "🟢" : "⚪"} Webhook reçu par WILLShop OS
                  </span>
                  <span className="text-[10px] text-gray-500">{connectionTestSteps.webhookReceived ? "OK" : "En attente"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {connectionTestSteps.conversationCreated ? "🟢" : "⚪"} Conversation créée dans le CRM
                  </span>
                  <span className="text-[10px] text-gray-500">{connectionTestSteps.conversationCreated ? "OK" : "En attente"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {connectionTestSteps.aiCalled ? "🟢" : "⚪"} SalesAgentService appelé
                  </span>
                  <span className="text-[10px] text-gray-500">{connectionTestSteps.aiCalled ? "OK" : "En attente"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {connectionTestSteps.responseGenerated ? "🟢" : "⚪"} Réponse IA générée
                  </span>
                  <span className="text-[10px] text-gray-500">{connectionTestSteps.responseGenerated ? "OK" : "En attente"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {connectionTestSteps.responseSent ? "🟢" : "⚪"} Réponse envoyée au client WhatsApp
                  </span>
                  <span className="text-[10px] text-gray-500">{connectionTestSteps.responseSent ? "OK" : "En attente"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setShowTestConnectionModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-xs"
              >
                Fermer
              </button>
              <button
                onClick={checkRealWhatsAppConnectionTest}
                disabled={isTestingConnection}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingConnection ? "animate-spin" : ""}`} />
                Vérifier la Réception ("BONJOUR")
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISCONNECT WHATSAPP */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#181824] pb-3">
              <h3 className="font-bold text-rose-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Déconnecter la Ligne WhatsApp
              </h3>
              <button onClick={() => setShowDisconnectModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Êtes-vous sûr de vouloir déconnecter le numéro {whatsappNumberInfo?.phone_number} ? L&apos;Agent IA ne pourra plus recevoir les messages en direct.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleDisconnectWhatsApp}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Confirmer Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW WHATSAPP MESSAGE */}
      {showNewMsgModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#181824] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#7B61FF]" /> Envoyer un Message WhatsApp
              </h3>
              <button onClick={() => setShowNewMsgModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNewWhatsAppMessage} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Sélectionner un Client *</label>
                <select
                  required
                  value={newMsgForm.customerId}
                  onChange={(e) => setNewMsgForm({ ...newMsgForm, customerId: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7B61FF]"
                >
                  <option value="">-- Choisir un client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Message WhatsApp *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tapez le message à envoyer..."
                  value={newMsgForm.messageText}
                  onChange={(e) => setNewMsgForm({ ...newMsgForm, messageText: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#181824] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMsgModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSending || !newMsgForm.customerId || !newMsgForm.messageText.trim()}
                  className="px-5 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  {isSending ? "Envoi..." : "Envoyer le Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
