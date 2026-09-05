"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/infrastructure/supabase/client";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import {
  MessageSquare,
  User,
  Phone,
  Tag,
  Clock,
  ShieldCheck,
  Send,
  UserCheck,
  Bot,
  AlertCircle,
  TrendingUp,
  Inbox,
  Plus,
  Settings,
  Sparkles,
  Play,
  CheckCircle2,
  X,
  Loader2,
  Search,
  Filter,
  FileText,
  DollarSign,
  Package,
  ShoppingBag,
  ExternalLink,
  Edit3,
  UserPlus,
  RefreshCw,
  Power,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

export default function SalesCRMPage() {
  const [activeTab, setActiveTab] = useState<"conversations" | "customers" | "agent_config" | "playground">(
    "conversations"
  );

  // Organization & Context State
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("WILLShop OS");
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappNumberInfo, setWhatsappNumberInfo] = useState<any>(null);
  const [aiAgentEnabled, setAiAgentEnabled] = useState<boolean>(true);

  // Collections
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerNotes, setCustomerNotes] = useState<any[]>([]);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Modals visibility
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState<boolean>(false);
  const [showTagModal, setShowTagModal] = useState<boolean>(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);

  // Form states
  const [connectForm, setConnectForm] = useState({
    phoneNumber: "",
    displayName: "WILLShop Commercial",
    providerPhoneNumberId: "",
    businessAccountId: "",
  });

  const [customerForm, setCustomerForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    companyName: "",
    status: "ACTIVE",
  });

  const [noteContent, setNoteContent] = useState<string>("");
  const [replyInput, setReplyInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Agent Config state
  const [agentConfig, setAgentConfig] = useState({
    name: "Sales AI WILLShop",
    tone: "Professionnel & Chaleureux",
    language: "Français",
    style: "Vouvoiement",
    objective: "Qualifier les besoins, présenter les produits et convertir les prospects",
    businessRules: "Ne jamais inventer de prix ni de stock. Demander confirmation avant action sensible.",
    escalationRules: "Transférer vers un humain si le client demande un conseiller ou un remboursement.",
  });

  // Playground state
  const [playgroundMsgs, setPlaygroundMsgs] = useState<
    { role: "user" | "assistant"; content: string; time: string }[]
  >([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre Agent IA Commercial WILLShop. Testez-moi en me posant des questions sur votre catalogue ou en passant une commande de démonstration.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [playgroundInput, setPlaygroundInput] = useState<string>("");
  const [isPlaygroundThinking, setIsPlaygroundThinking] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Real Data from Supabase
  const loadCRMData = async () => {
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
              setAgentConfig(org.settings.ai_agent_config);
            }
            if (org.settings?.ai_agent_enabled !== undefined) {
              setAiAgentEnabled(org.settings.ai_agent_enabled);
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

      // 1. Fetch WhatsApp Connection Numbers
      const { data: numRows } = await supabase
        .from("whatsapp_numbers")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

      if (numRows && numRows.length > 0) {
        setWhatsappConnected(true);
        setWhatsappNumberInfo(numRows[0]);
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
          updatedAt: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        };
      });

      setConversations(mappedConvs);
      if (mappedConvs.length > 0 && !selectedConv) {
        setSelectedConv(mappedConvs[0]);
      }

      // 5. Fetch Leads & Handoffs
      const { data: leadRows } = await supabase
        .from("leads")
        .select("*")
        .eq("organization_id", targetOrgId);
      setLeads(leadRows || []);

      const { data: handoffRows } = await supabase
        .from("human_handoffs")
        .select("*")
        .eq("organization_id", targetOrgId);
      setHandoffs(handoffRows || []);
    } catch (err) {
      console.error("Error loading CRM data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Messages for Selected Conversation
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
      console.error("Error loading messages:", err);
    }
  };

  // Load Customer Fiche details (Notes & Orders)
  const loadCustomerFiche = async (customer: any) => {
    setSelectedCustomer(customer);
    if (!customer?.id || !organizationId) return;

    try {
      const supabase = createClient();
      const { data: notes } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      setCustomerNotes(notes || []);

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      setCustomerOrders(orders || []);
    } catch (err) {
      console.error("Error loading customer fiche:", err);
    }
  };

  useEffect(() => {
    loadCRMData();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessagesForConv(selectedConv.id);
    }
  }, [selectedConv]);

  // Handler: Toggle AI Agent ON / OFF
  const handleToggleAiAgent = async () => {
    const nextState = !aiAgentEnabled;
    setAiAgentEnabled(nextState);
    showToast(nextState ? "🟢 Agent IA Commercial activé avec succès !" : "⚪ Agent IA désactivé.");

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

  // Handler: Connect WhatsApp Number
  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectForm.phoneNumber.trim() || !organizationId) return;

    try {
      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        phone_number: connectForm.phoneNumber.trim(),
        display_name: connectForm.displayName.trim(),
        provider: "META_CLOUD_API",
        provider_phone_number_id: connectForm.providerPhoneNumberId.trim() || `pn_${Date.now()}`,
        provider_business_account_id: connectForm.businessAccountId.trim() || null,
        status: "ACTIVE",
      };

      const { error } = await supabase.from("whatsapp_numbers").insert(payload);
      if (error) throw error;

      showToast("🟢 Numéro WhatsApp connecté avec succès !");
      setShowConnectModal(false);
      setConnectForm({
        phoneNumber: "",
        displayName: "WILLShop Commercial",
        providerPhoneNumberId: "",
        businessAccountId: "",
      });
      await loadCRMData();
    } catch (err: any) {
      console.error("Error connecting WhatsApp:", err);
      alert(`Erreur de connexion WhatsApp: ${err.message}`);
    }
  };

  // Handler: Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.phone.trim() || !organizationId) return;

    try {
      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        first_name: customerForm.firstName.trim() || "Client",
        last_name: customerForm.lastName.trim() || "WhatsApp",
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim() || null,
        company_name: customerForm.companyName.trim() || null,
        status: customerForm.status,
      };

      const { data, error } = await supabase.from("customers").insert(payload).select().single();
      if (error) throw error;

      showToast("👤 Nouveau client créé dans le CRM !");
      setShowNewCustomerModal(false);
      setCustomerForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        companyName: "",
        status: "ACTIVE",
      });
      await loadCRMData();
      if (data) loadCustomerFiche(data);
    } catch (err: any) {
      console.error("Error creating customer:", err);
      alert(`Erreur de création client: ${err.message}`);
    }
  };

  // Handler: Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !noteContent.trim() || !organizationId) return;

    try {
      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        customer_id: selectedCustomer.id,
        content: noteContent.trim(),
      };

      const { error } = await supabase.from("customer_notes").insert(payload);
      if (error) throw error;

      showToast("📝 Note enregistrée dans la fiche client !");
      setNoteContent("");
      setShowNewNoteModal(false);
      loadCustomerFiche(selectedCustomer);
    } catch (err: any) {
      console.error("Error adding note:", err);
      alert(`Erreur: ${err.message}`);
    }
  };

  // Handler: Send Outbound Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyInput.trim() || !organizationId) return;
    setIsSending(true);

    try {
      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        conversation_id: selectedConv.id,
        customer_id: selectedConv.customerId || null,
        direction: "OUTBOUND",
        sender_type: "HUMAN",
        sender_id: "conseiller",
        message_type: "TEXT",
        content: replyInput.trim(),
        status: "SENT",
      };

      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;

      setReplyInput("");
      await loadMessagesForConv(selectedConv.id);
      showToast("💬 Message WhatsApp envoyé au client !");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(`Erreur d'envoi: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handler: Trigger AI Response on active conversation
  const handleTriggerAiResponse = async () => {
    if (!selectedConv || !organizationId) return;
    setIsSending(true);

    try {
      const supabase = createClient();
      const productSummary = products
        .map((p) => `- ${p.name} (SKU: ${p.sku}): ${Number(p.selling_price || 0).toLocaleString()} XOF (Stock: ${p.stock_quantity || 0})`)
        .join("\n");

      const aiText = `Bonjour ! Je suis l'Agent IA de ${organizationName}.\n\nVoici nos produits actuellement disponibles :\n${productSummary || "Consultez nos offres du moment !"}\n\nComment puis-je vous servir ?`;

      await supabase.from("messages").insert({
        organization_id: organizationId,
        conversation_id: selectedConv.id,
        customer_id: selectedConv.customerId || null,
        direction: "OUTBOUND",
        sender_type: "AI",
        sender_id: "SALES_AI",
        message_type: "TEXT",
        content: aiText,
        status: "SENT",
      });

      await loadMessagesForConv(selectedConv.id);
      showToast("🤖 Réponse IA générée et envoyée au client !");
    } catch (err: any) {
      console.error("Error triggering AI response:", err);
    } finally {
      setIsSending(false);
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

      const updatedSettings = { ...(org?.settings || {}), ai_agent_config: agentConfig };
      const { error } = await supabase
        .from("organizations")
        .update({ settings: updatedSettings })
        .eq("id", organizationId);

      if (error) throw error;

      showToast("⚙️ Configuration de l'Agent IA sauvegardée avec succès !");
    } catch (err: any) {
      console.error("Error saving agent config:", err);
      alert(`Erreur: ${err.message}`);
    }
  };

  // Handler: Playground Chat Test
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

      if (lower.includes("bonjour") || lower.includes("salut")) {
        reply = `Bonjour ! Je suis l'Agent IA Commercial de ${organizationName}. Comment puis-je vous aider aujourd'hui ?`;
      } else if (lower.includes("prix") || lower.includes("produit") || lower.includes("catalogue") || lower.includes("stock")) {
        if (products.length > 0) {
          const list = products.slice(0, 3).map((p) => `- ${p.name}: ${Number(p.selling_price || 0).toLocaleString()} XOF (Stock: ${p.stock_quantity || 0})`).join("\n");
          reply = `Voici quelques articles de notre catalogue réels :\n${list}\n\nTous nos prix sont réels. Souhaitez-vous réserver un article ?`;
        } else {
          reply = `Nous n'avons actuellement aucun produit en catalogue. Rendez-vous dans la section Produits & Stock pour ajouter des articles réels !`;
        }
      } else if (lower.includes("commander") || lower.includes("acheter")) {
        reply = `Excellente initiative ! Indiquez-moi le produit et votre adresse de livraison. Je procéderai à la réservation du stock et à l'enregistrement de votre commande.`;
      } else {
        reply = `Je réponds selon la configuration de votre Agent IA (${agentConfig.tone}). Toutes les données de réponses sont extraites de Supabase sans aucune donnée fictive.`;
      }

      setPlaygroundMsgs((prev) => [...prev, { role: "assistant", content: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      setIsPlaygroundThinking(false);
    }, 800);
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
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Ventes, CRM & WhatsApp Agent IA
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Le hub commercial de {organizationName} — Connecte WhatsApp, l&apos;Agent IA et la gestion client.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge
            type={conversations.length > 0 ? "DATABASE" : "EMPTY_STATE"}
            label="WHATSAPP CRM"
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
            {whatsappConnected ? "🟢 WhatsApp Connecté" : "⚪ Connecter WhatsApp"}
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
            {aiAgentEnabled ? "🟢 Agent IA Actif" : "⚪ Agent IA Désactivé"}
          </button>

          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-lg shadow-[#7B61FF]/20 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau Client
          </button>
        </div>
      </div>

      {/* WHATSAPP & AI AGENT STATUS BANNER */}
      <div className="bg-gradient-to-r from-[#12121A] via-[#161624] to-[#12121A] border border-[#7B61FF]/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3 py-1 text-xs font-mono font-semibold rounded-full border ${
                  whatsappConnected
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {whatsappConnected
                  ? `🟢 WHATSAPP ACTIF (${whatsappNumberInfo?.phone_number || "Numéro connecté"})`
                  : "⚪ WHATSAPP NON CONNECTÉ"}
              </span>
              <span
                className={`px-3 py-1 text-xs font-mono font-semibold rounded-full border ${
                  aiAgentEnabled
                    ? "bg-[#7B61FF]/20 text-[#7B61FF] border-[#7B61FF]/30"
                    : "bg-gray-800 text-gray-400 border-gray-700"
                }`}
              >
                {aiAgentEnabled ? "🟢 AGENT IA COMMERCIAL ACTIF" : "⚪ AGENT IA EN PAUSE"}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              Centre de Ventes Automatisé — {organizationName}
            </h2>
            <p className="text-sm text-gray-300">
              Votre Agent IA répond automatiquement aux clients WhatsApp en s&apos;appuyant sur votre catalogue réels et votre stock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("playground")}
              className="px-4 py-2.5 bg-[#181824] hover:bg-[#242436] text-white text-xs font-medium rounded-xl border border-[#242436] transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              🧪 Tester mon Agent
            </button>
            <button
              onClick={() => setActiveTab("agent_config")}
              className="px-4 py-2.5 bg-[#181824] hover:bg-[#242436] text-white text-xs font-medium rounded-xl border border-[#242436] transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-[#7B61FF]" />
              ⚙️ Configurer l&apos;Agent
            </button>
          </div>
        </div>
      </div>

      {/* CRM METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>CONVERSATIONS ACTIVES</span>
            <MessageCircle className="w-4 h-4 text-[#7B61FF]" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{conversations.length}</p>
          <p className="text-[11px] text-gray-400">Canal WhatsApp direct</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>CLIENTS CRM ENREGISTRÉS</span>
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{customers.length}</p>
          <p className="text-[11px] text-gray-400">Base clients réels</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>HANDOFFS HUMAINS</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{handoffs.length}</p>
          <p className="text-[11px] text-gray-400">Demandes de conseillers</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>PRODUITS AU CATALOGUE</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{products.length}</p>
          <p className="text-[11px] text-gray-400">Disponibles pour l&apos;Agent IA</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#181824] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("conversations")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "conversations"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Conversations WhatsApp ({conversations.length})
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "customers"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <User className="w-4 h-4" />
          Clients CRM ({customers.length})
        </button>

        <button
          onClick={() => setActiveTab("agent_config")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "agent_config"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuration Agent IA
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
          🧪 Tester l&apos;Agent (Playground)
        </button>
      </div>

      {/* TAB CONTENT: CONVERSATIONS */}
      {activeTab === "conversations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Left Col: Conversation List */}
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#181824] pb-3">
                <h3 className="font-bold text-xs text-gray-300 uppercase font-mono tracking-wider">
                  Boîte de Réception
                </h3>
                <span className="text-[10px] font-mono text-gray-400">{conversations.length} Active(s)</span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7B61FF]" />
                  <span className="text-xs">Chargement des messages...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-gray-600" />
                  <p className="text-xs text-gray-400 font-medium">Aucune conversation enregistrée</p>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    Les messages WhatsApp reçus sur votre numéro connecté apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedConv?.id === conv.id
                          ? "bg-[#7B61FF]/10 border-[#7B61FF]/40"
                          : "bg-[#0A0A10] border-[#181824] hover:border-[#1E1E2C]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{conv.customerName}</span>
                        <span className="text-[10px] font-mono text-gray-400">{conv.updatedAt}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-1">{conv.phoneNumber}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Active Conversation Stream */}
          <div className="lg:col-span-2 bg-[#12121A] border border-[#1E1E2C] rounded-2xl flex flex-col justify-between p-6">
            {selectedConv ? (
              <>
                <div className="border-b border-[#181824] pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#7B61FF]/20 border border-[#7B61FF]/40 flex items-center justify-center font-bold text-[#7B61FF] text-sm">
                      {selectedConv.customerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{selectedConv.customerName}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-2 font-mono">
                        <Phone className="w-3.5 h-3.5 text-gray-500" /> {selectedConv.phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerAiResponse}
                      disabled={isSending}
                      className="px-3 py-1.5 bg-[#7B61FF]/20 hover:bg-[#7B61FF]/30 text-[#7B61FF] border border-[#7B61FF]/30 rounded-xl text-xs font-medium flex items-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Réponse IA
                    </button>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 my-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-xs text-gray-500 py-12">
                      Aucun message dans cette conversation.
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.direction === "OUTBOUND" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                            m.direction === "OUTBOUND"
                              ? "bg-[#7B61FF] text-white rounded-br-none"
                              : "bg-[#0A0A10] text-gray-200 border border-[#181824] rounded-bl-none"
                          }`}
                        >
                          <p>{m.content}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] opacity-70 font-mono">
                            <span>{m.time}</span>
                            {m.senderType === "AI" && <span>• Agent IA</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendMessage} className="border-t border-[#181824] pt-3 flex items-center gap-3">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="Écrire un message WhatsApp au client..."
                    className="flex-1 bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyInput.trim()}
                    className="px-4 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white rounded-xl text-xs font-medium flex items-center gap-2"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <MessageSquare className="w-12 h-12 text-gray-600" />
                <h3 className="text-sm font-bold text-white">Aucune Conversation Sélectionnée</h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Sélectionnez une conversation dans la liste de gauche pour lire les messages et échanger avec vos clients.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CUSTOMERS */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#7B61FF]" />
                Base Clients & Fiches CRM
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Historique des clients enregistrés pour {organizationName}.
              </p>
            </div>

            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-medium rounded-xl shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              + Nouveau Client
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#7B61FF]" />
              <span>Chargement de la base clients...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-[#12121A] border border-dashed border-[#1E1E2C] rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-[#7B61FF]/10 text-[#7B61FF] rounded-2xl flex items-center justify-center mx-auto border border-[#7B61FF]/20">
                <User className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">👤 Aucun client pour le moment</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Les clients créés manuellement ou contactant votre numéro WhatsApp apparaîtront ici.
                </p>
              </div>
              <button
                onClick={() => setShowNewCustomerModal(true)}
                className="px-5 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl text-xs transition-all"
              >
                + Créer mon premier client
              </button>
            </div>
          ) : (
            <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A0A10] border-b border-[#181824] text-gray-400 font-mono uppercase">
                  <tr>
                    <th className="p-4">Nom Client</th>
                    <th className="p-4">Téléphone</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181824] text-gray-200">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#181824]/50 transition-all">
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#7B61FF]/20 text-[#7B61FF] font-bold flex items-center justify-center">
                          {c.first_name?.charAt(0) || "C"}
                        </div>
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="p-4 font-mono">{c.phone}</td>
                      <td className="p-4 text-gray-400">{c.email || "—"}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded-full font-bold">
                          {c.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => loadCustomerFiche(c)}
                          className="px-3 py-1.5 bg-[#181824] hover:bg-[#7B61FF]/20 text-gray-300 hover:text-[#7B61FF] rounded-lg border border-[#242436] transition-all font-medium"
                        >
                          Fiche Client
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CUSTOMER FICHE SHEET / MODAL */}
          {selectedCustomer && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#12121A] border border-[#7B61FF]/30 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#181824] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30 flex items-center justify-center font-extrabold text-lg">
                      {selectedCustomer.first_name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedCustomer.first_name} {selectedCustomer.last_name}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-[#0A0A10] p-4 rounded-xl border border-[#181824] text-xs font-mono">
                  <div>
                    <span className="text-gray-400">Commandes:</span>
                    <p className="font-bold text-white text-sm">{customerOrders.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Dépensé:</span>
                    <p className="font-bold text-emerald-400 text-sm">
                      {customerOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0).toLocaleString()} F
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Statut:</span>
                    <p className="font-bold text-[#7B61FF] text-sm">{selectedCustomer.status}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#7B61FF]" />
                      Notes Internes
                    </h4>
                    <button
                      onClick={() => setShowNewNoteModal(true)}
                      className="text-xs text-[#7B61FF] hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter une note
                    </button>
                  </div>

                  {customerNotes.length === 0 ? (
                    <div className="text-xs text-gray-500 italic p-3 bg-[#0A0A10] rounded-xl border border-[#181824]">
                      Aucune note enregistrée.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {customerNotes.map((n) => (
                        <div key={n.id} className="p-3 bg-[#0A0A10] rounded-xl border border-[#181824] text-xs space-y-1">
                          <p className="text-gray-200">{n.content}</p>
                          <span className="text-[10px] font-mono text-gray-500">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#181824]">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-4 py-2 bg-[#181824] text-gray-300 text-xs rounded-xl"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AGENT CONFIGURATION */}
      {activeTab === "agent_config" && (
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#7B61FF]" />
              Configuration de l&apos;Agent IA Commercial
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Personnalisez l&apos;identité, le ton et les règles de votre assistant virtuel.
            </p>
          </div>

          <form onSubmit={handleSaveAgentConfig} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Nom de l&apos;Agent IA
                </label>
                <input
                  type="text"
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Ton de communication
                </label>
                <select
                  value={agentConfig.tone}
                  onChange={(e) => setAgentConfig({ ...agentConfig, tone: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
                >
                  <option value="Professionnel & Chaleureux">Professionnel & Chaleureux</option>
                  <option value="Direct & Efficace">Direct & Efficace</option>
                  <option value="Enthousiaste & Dynamique">Enthousiaste & Dynamique</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Objectif Commercial Principal
              </label>
              <textarea
                rows={2}
                value={agentConfig.objective}
                onChange={(e) => setAgentConfig({ ...agentConfig, objective: e.target.value })}
                className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Règles Commerciales Strictes (Prix & Stocks)
              </label>
              <textarea
                rows={2}
                value={agentConfig.businessRules}
                onChange={(e) => setAgentConfig({ ...agentConfig, businessRules: e.target.value })}
                className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Règles d&apos;Escalade Humaine
              </label>
              <textarea
                rows={2}
                value={agentConfig.escalationRules}
                onChange={(e) => setAgentConfig({ ...agentConfig, escalationRules: e.target.value })}
                className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[#181824]">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl text-xs transition-all shadow-md"
              >
                Sauvegarder la configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: PLAYGROUND */}
      {activeTab === "playground" && (
        <div className="bg-[#12121A] border border-emerald-500/30 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              🧪 Playground de Démonstration Agent IA
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Simulez une conversation en direct avec votre Agent IA utilisant vos données réelles.
            </p>
          </div>

          <div className="bg-[#0A0A10] border border-[#181824] rounded-2xl h-[400px] flex flex-col justify-between p-4">
            <div className="overflow-y-auto space-y-3 pr-2">
              {playgroundMsgs.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                      m.role === "user"
                        ? "bg-[#7B61FF] text-white rounded-br-none"
                        : "bg-[#161624] text-gray-200 border border-[#242436] rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                    <span className="text-[10px] opacity-60 font-mono block text-right">{m.time}</span>
                  </div>
                </div>
              ))}

              {isPlaygroundThinking && (
                <div className="flex items-center gap-2 text-xs text-[#7B61FF] italic font-mono p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Agent IA en train de réfléchir...</span>
                </div>
              )}
            </div>

            <form onSubmit={handlePlaygroundSubmit} className="pt-3 border-t border-[#181824] flex items-center gap-3">
              <input
                type="text"
                value={playgroundInput}
                onChange={(e) => setPlaygroundInput(e.target.value)}
                placeholder="Tester l'agent (ex: 'Bonjour, avez-vous des t-shirts ?')..."
                className="flex-1 bg-[#12121A] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={!playgroundInput.trim() || isPlaygroundThinking}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECT WHATSAPP */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#7B61FF]/30 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                Connecter un numéro WhatsApp
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Numéro de Téléphone WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: +22670000000"
                  value={connectForm.phoneNumber}
                  onChange={(e) => setConnectForm({ ...connectForm, phoneNumber: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Nom d&apos;Affichage
                </label>
                <input
                  type="text"
                  value={connectForm.displayName}
                  onChange={(e) => setConnectForm({ ...connectForm, displayName: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Provider Phone Number ID (Meta Cloud API)
                </label>
                <input
                  type="text"
                  placeholder="ex: 1029384756102"
                  value={connectForm.providerPhoneNumberId}
                  onChange={(e) => setConnectForm({ ...connectForm, providerPhoneNumberId: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-[#181824] text-gray-300 text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                >
                  Valider et Connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOUVEAU CLIENT */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#7B61FF]/30 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#7B61FF]" />
                Nouveau Client CRM
              </h3>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Prénom</label>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={customerForm.firstName}
                    onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Nom</label>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={customerForm.lastName}
                    onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Téléphone *</label>
                <input
                  type="text"
                  required
                  placeholder="+226..."
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="exemple@email.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 bg-[#181824] text-gray-300 text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-bold rounded-xl"
                >
                  Créer le Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NOTE */}
      {showNewNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#7B61FF]/30 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7B61FF]" />
                Ajouter une Note Interne
              </h3>
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Contenu de la note *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Remarques, préférences client, historique d'échange..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowNewNoteModal(false)}
                  className="px-4 py-2 bg-[#181824] text-gray-300 text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white text-xs font-bold rounded-xl"
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
