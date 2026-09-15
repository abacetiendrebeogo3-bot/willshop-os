"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Radio,
  Archive,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square,
  AlertTriangle,
  Image as ImageIcon,
  Mic,
  FileDown,
  Eye,
  EyeOff,
} from "lucide-react";

// Helper: Format raw phone numbers for display (+226 77 XX XX XX)
function formatPhoneNumber(phone?: string): string {
  if (!phone) return "Numéro non spécifié";
  const clean = phone.replace(/[^0-[#]+/g, "");
  if (clean.length === 11 && clean.startsWith("226")) {
    return `+226 ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
  }
  if (clean.length === 8) {
    return `+226 ${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)}`;
  }
  return phone.startsWith("+") ? phone : `+${phone}`;
}

// Helper: Format relative timestamp ("Il y a 2 min", "Il y a 3 h", "Hier", "12 sept.")
function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function SalesCRMPage() {
  const [activeTab, setActiveTab] = useState<"conversations" | "customers" | "agent_config" | "playground">(
    "conversations"
  );

  // Organization & Context State
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("WILLShop OS");
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappNumberInfo, setWhatsappNumberInfo] = useState<any>(null);
  const [whatsappNumbersList, setWhatsappNumbersList] = useState<any[]>([]);
  const [aiAgentEnabled, setAiAgentEnabled] = useState<boolean>(true);

  // Collections & State
  const [rawConversations, setRawConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerNotes, setCustomerNotes] = useState<any[]>([]);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerAttributions, setCustomerAttributions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Filters & Search State (Section 8, 9, 10)
  const [statusTab, setStatusTab] = useState<
    "ALL" | "ACTIVE" | "WAITING" | "HANDOFF" | "AI_ACTIVE" | "HUMAN_ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");
  const [whatsappFilter, setWhatsappFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST" | "UNREAD_FIRST" | "HANDOFF_FIRST">("NEWEST");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Pagination State (Section 21)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Multi-Selection State (Section 6 & 7)
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set());

  // Modals visibility
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [showBulkArchiveModal, setShowBulkArchiveModal] = useState<boolean>(false);
  const [targetDeleteIds, setTargetDeleteIds] = useState<string[]>([]);
  const [isActionProcessing, setIsActionProcessing] = useState<boolean>(false);

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

  // Agent Config state
  const [agentConfig, setAgentConfig] = useState({
    name: "Sales AI WILLShop",
    presentation: "Assistant commercial virtuel dédié à votre écoute 24/7.",
    custom_instructions: "Tu es l'assistant commercial virtuel de WILLShop OS. Réponds avec courtoisie et professionnalisme.",
    tone: "Professionnel & Chaleureux",
    style: "Vouvoiement respectueux",
    language: "Français",
    formality: "SOUTENU",
    mission: {
      reply_prospects: true,
      show_products: true,
      search_products: true,
      check_stock: true,
      check_price: true,
      check_delivery_zones: true,
      qualify_prospects: true,
      take_orders: true,
      track_orders: true,
    },
    rules: {
      no_invent_price: true,
      no_invent_stock: true,
      no_invent_orders: true,
      no_invent_delivery: true,
      no_invent_payment: true,
      no_unfounded_promises: true,
      escalate_on_human_request: true,
    },
    schedule: {
      active: true,
      startTime: "08:00",
      endTime: "20:00",
      timezone: "Africa/Ouagadougou",
    },
    escalation: {
      conditions: "Client demande un agent humain ou réclame un remboursement",
      responsible: "Commercial d astreinte",
      notification: "WhatsApp & E-mail",
    },
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

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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
              const loadedCfg = org.settings.ai_agent_config;
              setAgentConfig((prev) => ({
                ...prev,
                ...loadedCfg,
                mission: { ...prev.mission, ...(loadedCfg.mission || {}) },
                rules: { ...prev.rules, ...(loadedCfg.rules || {}) },
                schedule: { ...prev.schedule, ...(loadedCfg.schedule || {}) },
                escalation: { ...prev.escalation, ...(loadedCfg.escalation || {}) },
              }));
            }
            if (org.settings?.ai_agent_enabled !== undefined) {
              setAiAgentEnabled(org.settings.ai_agent_enabled);
            }
          }
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

      setWhatsappNumbersList(numRows || []);
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

      // 4. Fetch Conversations with relations
      const { data: convRows } = await supabase
        .from("conversations")
        .select("*, customers(id, first_name, last_name, phone, email, address, city), whatsapp_numbers(id, display_name, phone_number)")
        .eq("organization_id", targetOrgId)
        .order("last_message_at", { ascending: false });

      const mappedConvs = (convRows || []).map((c) => {
        const custName = c.customers
          ? `${c.customers.first_name || ""} ${c.customers.last_name || ""}`.trim()
          : "";
        const custPhone = c.customers?.phone || c.external_conversation_id || "Non spécifié";

        return {
          id: c.id,
          customerId: c.customer_id,
          customerName: custName || "Prospect WhatsApp",
          rawCustomerName: custName,
          phoneNumber: custPhone,
          formattedPhone: formatPhoneNumber(custPhone),
          status: c.status, // OPEN, PENDING, WAITING_CUSTOMER, WAITING_AGENT, CLOSED, ARCHIVED
          conversationMode: c.conversation_mode || "AI_ACTIVE", // AI_ACTIVE, HUMAN_ACTIVE, ESCALATED, PAUSED
          assignedAgent: c.assigned_agent || "SALES_AI",
          unreadCount: c.unread_count || 0,
          lastMessageAt: c.last_message_at || c.created_at,
          updatedAt: c.last_message_at ? formatRelativeTime(c.last_message_at) : "",
          whatsappNumberId: c.whatsapp_number_id,
          whatsappDisplayName: c.whatsapp_numbers?.display_name || "WhatsApp Business",
          whatsappPhoneNumber: c.whatsapp_numbers?.phone_number || "",
          customerObj: c.customers || null,
        };
      });

      setRawConversations(mappedConvs);
      if (mappedConvs.length > 0 && !selectedConv) {
        handleSelectConversation(mappedConvs[0]);
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

  // Open Conversation & Auto Mark as Read (Section 15)
  const handleSelectConversation = async (conv: any) => {
    setSelectedConv(conv);
    if (conv.customerObj) {
      loadCustomerFiche(conv.customerObj);
    } else if (conv.customerId) {
      const matchCust = customers.find((c) => c.id === conv.customerId);
      if (matchCust) loadCustomerFiche(matchCust);
    }

    // Auto mark as read if unread_count > 0
    if (conv.unreadCount > 0 && organizationId) {
      try {
        const supabase = createClient();
        await supabase
          .from("conversations")
          .update({ unread_count: 0 })
          .eq("id", conv.id);

        setRawConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error("Error marking conversation as read:", err);
      }
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
          messageType: m.message_type || "TEXT",
          content: m.content || "",
          mediaUrl: m.media_url || null,
          mediaType: m.media_type || null,
          status: m.status,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: m.created_at,
        }))
      );
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  // Load Customer Fiche details (Notes, Orders, Attributions) (Section 13)
  const loadCustomerFiche = async (customer: any) => {
    setSelectedCustomer(customer);
    if (!customer?.id || !organizationId) return;

    try {
      const supabase = createClient();
      const [{ data: notes }, { data: orders }, { data: attributions }] = await Promise.all([
        supabase
          .from("customer_notes")
          .select("*")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("ad_attributions")
          .select("*")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false }),
      ]);

      setCustomerNotes(notes || []);
      setCustomerOrders(orders || []);
      setCustomerAttributions(attributions || []);
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

  // Filtered & Sorted Conversations Computation (Section 8, 9, 10)
  const filteredConversations = useMemo(() => {
    return rawConversations.filter((c) => {
      // Status & Mode Filter Tabs
      if (statusTab === "ACTIVE" && c.status === "ARCHIVED") return false;
      if (statusTab === "ARCHIVED" && c.status !== "ARCHIVED") return false;
      if (statusTab === "WAITING" && c.status !== "WAITING_CUSTOMER" && c.status !== "WAITING_AGENT") return false;
      if (statusTab === "HANDOFF" && c.conversationMode !== "ESCALATED" && c.status !== "WAITING_AGENT") return false;
      if (statusTab === "AI_ACTIVE" && c.conversationMode !== "AI_ACTIVE") return false;
      if (statusTab === "HUMAN_ACTIVE" && c.conversationMode !== "HUMAN_ACTIVE") return false;

      // Secondary Unread Filter
      if (unreadOnly && c.unreadCount === 0) return false;

      // Secondary Period Filter
      if (periodFilter !== "ALL" && c.lastMessageAt) {
        const msgDate = new Date(c.lastMessageAt).getTime();
        const now = Date.now();
        if (periodFilter === "TODAY" && now - msgDate > 24 * 60 * 60 * 1000) return false;
        if (periodFilter === "7DAYS" && now - msgDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (periodFilter === "30DAYS" && now - msgDate > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Secondary WhatsApp Number Filter
      if (whatsappFilter !== "ALL" && c.whatsappNumberId !== whatsappFilter) return false;

      // Debounced Search (Name, Phone, WhatsApp Number)
      if (debouncedSearch) {
        const nameMatch = c.customerName.toLowerCase().includes(debouncedSearch);
        const phoneMatch = c.phoneNumber.toLowerCase().includes(debouncedSearch);
        const waMatch = (c.whatsappDisplayName || "").toLowerCase().includes(debouncedSearch);
        if (!nameMatch && !phoneMatch && !waMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === "NEWEST") return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      if (sortOrder === "OLDEST") return new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime();
      if (sortOrder === "UNREAD_FIRST") return (b.unreadCount > 0 ? 1 : 0) - (a.unreadCount > 0 ? 1 : 0);
      if (sortOrder === "HANDOFF_FIRST") return (b.conversationMode === "ESCALATED" ? 1 : 0) - (a.conversationMode === "ESCALATED" ? 1 : 0);
      return 0;
    });
  }, [rawConversations, statusTab, unreadOnly, periodFilter, whatsappFilter, sortOrder, debouncedSearch]);

  // Paginated Conversations (Section 21)
  const paginatedConversations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredConversations.slice(start, start + pageSize);
  }, [filteredConversations, currentPage]);

  const totalPages = Math.ceil(filteredConversations.length / pageSize) || 1;

  // Multi-Selection Checkbox Handlers (Section 6 & 7)
  const handleToggleSelectConv = (id: string) => {
    setSelectedConvIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllInPage = () => {
    if (selectedConvIds.size >= paginatedConversations.length && paginatedConversations.length > 0) {
      setSelectedConvIds(new Set());
    } else {
      const next = new Set(paginatedConversations.map((c) => c.id));
      setSelectedConvIds(next);
    }
  };

  // ARCHIVE ACTIONS (Section 3 & 7)
  const handleArchiveConversations = async (ids: string[]) => {
    if (ids.length === 0 || !organizationId) return;
    setIsActionProcessing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversations")
        .update({ status: "ARCHIVED", updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      showToast(`📦 ${ids.length} conversation(s) archivée(s) avec succès.`);
      setRawConversations((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, status: "ARCHIVED" } : c))
      );
      setSelectedConvIds(new Set());
      setShowBulkArchiveModal(false);
      if (selectedConv && ids.includes(selectedConv.id)) {
        setSelectedConv((prev: any) => ({ ...prev, status: "ARCHIVED" }));
      }
    } catch (err: any) {
      alert(`Erreur d'archivage : ${err.message}`);
    } finally {
      setIsActionProcessing(false);
    }
  };

  // RESTORE ACTIONS (Section 3)
  const handleRestoreConversations = async (ids: string[]) => {
    if (ids.length === 0 || !organizationId) return;
    setIsActionProcessing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversations")
        .update({ status: "OPEN", updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      showToast(`↩️ ${ids.length} conversation(s) restaurée(s) dans la boîte active.`);
      setRawConversations((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, status: "OPEN" } : c))
      );
      setSelectedConvIds(new Set());
      if (selectedConv && ids.includes(selectedConv.id)) {
        setSelectedConv((prev: any) => ({ ...prev, status: "OPEN" }));
      }
    } catch (err: any) {
      alert(`Erreur de restauration : ${err.message}`);
    } finally {
      setIsActionProcessing(false);
    }
  };

  // DELETE ACTIONS (Section 4 & 5 & 18)
  const handleDeleteConversationsConfirmed = async () => {
    if (targetDeleteIds.length === 0 || !organizationId) return;
    setIsActionProcessing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversations")
        .delete()
        .in("id", targetDeleteIds);

      if (error) throw error;

      showToast(`🗑️ ${targetDeleteIds.length} conversation(s) supprimée(s) définitivement. (Clients & commandes conservés)`);
      setRawConversations((prev) => prev.filter((c) => !targetDeleteIds.includes(c.id)));
      if (selectedConv && targetDeleteIds.includes(selectedConv.id)) {
        setSelectedConv(null);
      }
      setSelectedConvIds(new Set());
      setShowDeleteConfirmModal(false);
      setTargetDeleteIds([]);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message}`);
    } finally {
      setIsActionProcessing(false);
    }
  };

  // Handler: Toggle Conversation Mode (AI_ACTIVE <-> HUMAN_ACTIVE)
  const handleToggleConvMode = async (convId: string, currentMode: string) => {
    const nextMode = currentMode === "AI_ACTIVE" ? "HUMAN_ACTIVE" : "AI_ACTIVE";
    try {
      const supabase = createClient();
      await supabase
        .from("conversations")
        .update({ conversation_mode: nextMode, assigned_agent: nextMode === "AI_ACTIVE" ? "SALES_AI" : "HUMAN" })
        .eq("id", convId);

      showToast(nextMode === "AI_ACTIVE" ? "🟢 Agent IA réactivé pour cette discussion" : "👤 Main prise par le commercial humain");
      setRawConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, conversationMode: nextMode } : c))
      );
      if (selectedConv?.id === convId) {
        setSelectedConv((prev: any) => ({ ...prev, conversationMode: nextMode }));
      }
    } catch (err: any) {
      alert(`Erreur bascule mode: ${err.message}`);
    }
  };

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

  // Handler: Send Outbound Message via Real Evolution API Endpoint
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyInput.trim() || !organizationId) return;
    setIsSending(true);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          text: replyInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(`Échec de l'envoi WhatsApp réel : ${data.error || "Erreur serveur"}`);
        return;
      }

      setReplyInput("");
      await loadMessagesForConv(selectedConv.id);
      showToast("💬 Message WhatsApp réel envoyé au client !");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(`Erreur d'envoi WhatsApp: ${err.message}`);
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

  // Handler: Real Backend Anthropic AI Playground Chat Test
  const handlePlaygroundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundInput.trim()) return;

    const userText = playgroundInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setPlaygroundMsgs((prev) => [...prev, { role: "user", content: userText, time: timeStr }]);
    setPlaygroundInput("");
    setIsPlaygroundThinking(true);

    try {
      const res = await fetch("/api/whatsapp/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: userText }),
      });

      const data = await res.json();
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (!res.ok || data.error) {
        setPlaygroundMsgs((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Agent IA non configuré — ${data.error || "Clé ANTHROPIC_API_KEY manquante dans Vercel."}`,
            time: replyTime,
          },
        ]);
        return;
      }

      setPlaygroundMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.responseText || "L'Agent IA a traité votre message.",
          time: replyTime,
        },
      ]);
    } catch (err: any) {
      setPlaygroundMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Erreur de communication avec l'Agent IA : ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsPlaygroundThinking(false);
    }
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
                Boîte de Réception Ventes & CRM
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Centre de messagerie e-commerce de {organizationName} — Organisez vos échanges WhatsApp et pilotez vos ventes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge
            type={rawConversations.length > 0 ? "DATABASE" : "EMPTY_STATE"}
            label="WHATSAPP CRM"
          />
          <Link
            href="/whatsapp"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium rounded-xl transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            💬 WhatsApp Hub
          </Link>

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

      {/* METRICS CARDS & INBOX STATUS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-gray-400 block">TOTAL CONVERSATIONS</span>
          <p className="text-2xl font-extrabold text-white font-mono">{rawConversations.length}</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 block">ACTIVES / OUVERTES</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">
            {rawConversations.filter((c) => c.status !== "ARCHIVED").length}
          </p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-blue-400 block">EN ATTENTE</span>
          <p className="text-2xl font-extrabold text-blue-400 font-mono">
            {rawConversations.filter((c) => (c.status === "WAITING_CUSTOMER" || c.status === "WAITING_AGENT") && c.status !== "ARCHIVED").length}
          </p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-amber-400 block">HANDOFFS HUMAINS</span>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">
            {rawConversations.filter((c) => c.conversationMode === "ESCALATED" && c.status !== "ARCHIVED").length}
          </p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-gray-500 block">ARCHIVÉES</span>
          <p className="text-2xl font-extrabold text-gray-400 font-mono">
            {rawConversations.filter((c) => c.status === "ARCHIVED").length}
          </p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#7B61FF] block">CLIENTS CRM</span>
          <p className="text-2xl font-extrabold text-[#7B61FF] font-mono">{customers.length}</p>
        </div>
      </div>

      {/* NAVIGATION TABS & SUB-NAV */}
      <div className="flex items-center gap-2 border-b border-[#181824] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("conversations")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "conversations"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30 font-bold"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Boîte de Réception ({filteredConversations.length})
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "customers"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30 font-bold"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <User className="w-4 h-4" />
          Clients CRM ({customers.length})
        </button>

        <Link
          href="/orders"
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all text-gray-400 hover:text-white hover:bg-[#12121A] whitespace-nowrap"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          Commandes
        </Link>

        <Link
          href="/sales/followups"
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all text-gray-400 hover:text-white hover:bg-[#12121A] whitespace-nowrap"
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Relances Commerciales
        </Link>

        <button
          onClick={() => setActiveTab("agent_config")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "agent_config"
              ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30 font-bold"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Settings className="w-4 h-4" />
          Agent IA Config
        </button>

        <button
          onClick={() => setActiveTab("playground")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === "playground"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold"
              : "text-gray-400 hover:text-white hover:bg-[#12121A]"
          }`}
        >
          <Play className="w-4 h-4" />
          🧪 Playground IA
        </button>
      </div>

      {/* TAB CONTENT: CONVERSATIONS INBOX */}
      {activeTab === "conversations" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERING BAR (SECTION 8, 9, 10) */}
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 space-y-3">
            {/* Top Row: Quick Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "ACTIVE", label: "🟢 Actives", count: rawConversations.filter((c) => c.status !== "ARCHIVED").length },
                  { key: "WAITING", label: "🔵 En attente", count: rawConversations.filter((c) => (c.status === "WAITING_CUSTOMER" || c.status === "WAITING_AGENT") && c.status !== "ARCHIVED").length },
                  { key: "HANDOFF", label: "🔴 Handoff humain", count: rawConversations.filter((c) => c.conversationMode === "ESCALATED" && c.status !== "ARCHIVED").length },
                  { key: "AI_ACTIVE", label: "🤖 IA active", count: rawConversations.filter((c) => c.conversationMode === "AI_ACTIVE" && c.status !== "ARCHIVED").length },
                  { key: "HUMAN_ACTIVE", label: "👤 Humain", count: rawConversations.filter((c) => c.conversationMode === "HUMAN_ACTIVE" && c.status !== "ARCHIVED").length },
                  { key: "ARCHIVED", label: "⚪ Archivées", count: rawConversations.filter((c) => c.status === "ARCHIVED").length },
                  { key: "ALL", label: "Toutes", count: rawConversations.length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusTab(tab.key as any);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      statusTab === tab.key
                        ? "bg-[#7B61FF] text-white shadow-md"
                        : "bg-[#181824] text-gray-300 hover:bg-[#242436]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="px-1.5 py-0.2 bg-black/30 rounded-full font-mono text-[10px]">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Unread Toggle */}
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  unreadOnly
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    : "bg-[#181824] text-gray-400 border-[#242436] hover:text-white"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${unreadOnly ? "bg-blue-400 animate-ping" : "bg-gray-500"}`} />
                Non lues uniquement
              </button>
            </div>

            {/* Bottom Row: Search, Period, WhatsApp Number & Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 border-t border-[#181824]">
              {/* Search Bar (Debounced) */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Rechercher par nom, téléphone (+226...), message..."
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7B61FF]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Period Filter */}
              <div>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as any)}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2 text-xs text-white outline-none focus:border-[#7B61FF]"
                >
                  <option value="ALL">🗓️ Toutes les dates</option>
                  <option value="TODAY">Aujourd&apos;hui (24h)</option>
                  <option value="7DAYS">7 derniers jours</option>
                  <option value="30DAYS">30 derniers jours</option>
                </select>
              </div>

              {/* Sorting */}
              <div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full bg-[#181824] border border-[#282838] rounded-xl p-2 text-xs text-white outline-none focus:border-[#7B61FF]"
                >
                  <option value="NEWEST">⚡ Plus récent d&apos;abord</option>
                  <option value="OLDEST">⏳ Plus ancien d&apos;abord</option>
                  <option value="UNREAD_FIRST">🔵 Non lus en premier</option>
                  <option value="HANDOFF_FIRST">🔴 Handoffs en premier</option>
                </select>
              </div>
            </div>

            {/* BULK ACTION BAR (SECTION 6 & 7) */}
            {selectedConvIds.size > 0 && (
              <div className="bg-[#7B61FF]/10 border border-[#7B61FF]/40 p-3 rounded-xl flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CheckSquare className="w-4 h-4 text-[#7B61FF]" />
                  <span>{selectedConvIds.size} conversation(s) sélectionnée(s)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleArchiveConversations(Array.from(selectedConvIds))}
                    disabled={isActionProcessing}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archiver sélection
                  </button>

                  <button
                    onClick={() => {
                      setTargetDeleteIds(Array.from(selectedConvIds));
                      setShowDeleteConfirmModal(true);
                    }}
                    disabled={isActionProcessing}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer sélection
                  </button>

                  <button
                    onClick={() => setSelectedConvIds(new Set())}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MAIN 2-COLUMNS INBOX WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[620px]">
            {/* Left Column: Conversation List */}
            <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#181824] pb-2 font-mono text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllInPage}
                      className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {selectedConvIds.size >= paginatedConversations.length && paginatedConversations.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#7B61FF]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                      <span>Tout élec.</span>
                    </button>
                  </div>
                  <span>{filteredConversations.length} Résultat(s)</span>
                </div>

                {isLoading ? (
                  <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7B61FF]" />
                    <span className="text-xs">Chargement de la boîte de réception...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <Inbox className="w-10 h-10 mx-auto text-gray-600" />
                    <p className="text-xs text-gray-300 font-bold">Aucune conversation trouvée</p>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                      {statusTab === "ARCHIVED"
                        ? "Vous n'avez actuellement aucune conversation archivée."
                        : "Aucun message ne correspond à vos filtres de recherche."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {paginatedConversations.map((conv) => {
                      const isSelected = selectedConvIds.has(conv.id);
                      const isCurrentActive = selectedConv?.id === conv.id;

                      return (
                        <div
                          key={conv.id}
                          className={`p-3.5 rounded-xl border transition-all relative group ${
                            isCurrentActive
                              ? "bg-[#7B61FF]/15 border-[#7B61FF]/50 shadow-md"
                              : isSelected
                              ? "bg-[#181824] border-[#7B61FF]/30"
                              : "bg-[#0A0A10] border-[#181824] hover:border-[#282838]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectConv(conv.id);
                              }}
                              className="mt-1 text-gray-400 hover:text-white"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#7B61FF]" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-600" />
                              )}
                            </button>

                            {/* Card Content Click */}
                            <div
                              onClick={() => handleSelectConversation(conv)}
                              className="flex-1 min-w-0 cursor-pointer space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 truncate">
                                  {conv.unreadCount > 0 && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                                  )}
                                  <span className="font-bold text-xs text-white truncate">
                                    {conv.rawCustomerName ? conv.rawCustomerName : conv.formattedPhone}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 shrink-0">
                                  {conv.updatedAt}
                                </span>
                              </div>

                              {/* Phone & Secondary WhatsApp Line */}
                              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                                <span>{conv.formattedPhone}</span>
                                {conv.whatsappDisplayName && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded">
                                    {conv.whatsappDisplayName}
                                  </span>
                                )}
                              </div>

                              {/* Badges & Mode Row */}
                              <div className="flex items-center justify-between pt-1">
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-bold border ${
                                    conv.status === "ARCHIVED"
                                      ? "bg-gray-500/10 text-gray-400 border-gray-500/30"
                                      : conv.conversationMode === "HUMAN_ACTIVE"
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                      : conv.conversationMode === "ESCALATED"
                                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  }`}
                                >
                                  {conv.status === "ARCHIVED"
                                    ? "⚪ Archivé"
                                    : conv.conversationMode === "HUMAN_ACTIVE"
                                    ? "👤 Humain"
                                    : conv.conversationMode === "ESCALATED"
                                    ? "🔴 Handoff"
                                    : "🟢 IA active"}
                                </span>

                                {/* Quick Hover Actions */}
                                <div className="hidden group-hover:flex items-center gap-1">
                                  {conv.status === "ARCHIVED" ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRestoreConversations([conv.id]);
                                      }}
                                      className="p-1 bg-gray-800 hover:bg-gray-700 text-emerald-400 rounded"
                                      title="Restaurer"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchiveConversations([conv.id]);
                                      }}
                                      className="p-1 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded"
                                      title="Archiver"
                                    >
                                      <Archive className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTargetDeleteIds([conv.id]);
                                      setShowDeleteConfirmModal(true);
                                    }}
                                    className="p-1 bg-gray-800 hover:bg-red-500/20 text-red-400 rounded"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#181824] pt-3 text-xs text-gray-400">
                  <span>
                    Page {currentPage} / {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 bg-[#181824] hover:bg-[#242436] rounded-lg disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 bg-[#181824] hover:bg-[#242436] rounded-lg disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Selected Thread View & Customer Context Sidebar */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-5">
              {selectedConv ? (
                <>
                  {/* Active Message Thread Panel (2 Cols) */}
                  <div className="md:col-span-2 flex flex-col justify-between border-r-0 md:border-r border-[#181824] pr-0 md:pr-4">
                    {/* Header with identity & actions (Section 12) */}
                    <div className="border-b border-[#181824] pb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-[#7B61FF]" />
                          {selectedConv.customerName}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">
                          {selectedConv.formattedPhone} • {selectedConv.whatsappDisplayName}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Mode Button */}
                        <button
                          onClick={() => handleToggleConvMode(selectedConv.id, selectedConv.conversationMode)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                            selectedConv.conversationMode === "HUMAN_ACTIVE"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          }`}
                        >
                          {selectedConv.conversationMode === "HUMAN_ACTIVE" ? (
                            <>
                              <Bot className="w-3.5 h-3.5" /> Réactiver IA
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Prendre la main
                            </>
                          )}
                        </button>

                        {/* Archive / Restore Button */}
                        {selectedConv.status === "ARCHIVED" ? (
                          <button
                            onClick={() => handleRestoreConversations([selectedConv.id])}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 rounded-lg text-xs font-semibold"
                            title="Restaurer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveConversations([selectedConv.id])}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded-lg text-xs font-semibold"
                            title="Archiver"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setTargetDeleteIds([selectedConv.id]);
                            setShowDeleteConfirmModal(true);
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Message Stream Timeline */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-3 my-2 max-h-[420px] pr-1">
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
                              className={`max-w-md p-3 rounded-2xl text-xs space-y-1.5 ${
                                m.direction === "OUTBOUND"
                                  ? "bg-[#7B61FF] text-white rounded-br-none"
                                  : "bg-[#0A0A10] text-gray-200 border border-[#181824] rounded-bl-none"
                              }`}
                            >
                              {/* MEDIA RENDERERS (SECTION 14) */}
                              {m.messageType === "IMAGE" && (
                                <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 p-1">
                                  {m.mediaUrl ? (
                                    <img
                                      src={m.mediaUrl}
                                      alt="Média WhatsApp"
                                      className="max-h-48 w-full object-contain rounded-lg"
                                    />
                                  ) : (
                                    <div className="p-3 text-[11px] text-amber-400 flex items-center gap-1.5">
                                      <ImageIcon className="w-4 h-4" />
                                      <span>Image transmise par WhatsApp</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {m.messageType === "AUDIO" && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 p-1.5 bg-black/30 rounded-xl">
                                    <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                                    {m.mediaUrl ? (
                                      <audio controls src={m.mediaUrl} className="w-full max-w-[200px] h-8" />
                                    ) : (
                                      <span className="text-[11px] text-gray-300 italic">Note vocale enregistrée</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {m.messageType === "DOCUMENT" && (
                                <div className="p-2 bg-black/30 rounded-xl flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="text-[11px] truncate">Document joint</span>
                                  </div>
                                  {m.mediaUrl ? (
                                    <a
                                      href={m.mediaUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 bg-gray-800 hover:bg-gray-700 text-white rounded"
                                    >
                                      <FileDown className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">Media indisponible</span>
                                  )}
                                </div>
                              )}

                              {/* Text content */}
                              {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}

                              <div className="flex items-center justify-end gap-1.5 text-[10px] opacity-70 font-mono">
                                <span>{m.time}</span>
                                {m.senderType === "AI" && <span>• Agent IA</span>}
                                {m.senderType === "HUMAN" && <span>• Commercial</span>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply Composer Form */}
                    <form onSubmit={handleSendMessage} className="border-t border-[#181824] pt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Répondre sur WhatsApp..."
                        className="flex-1 bg-[#0A0A10] border border-[#1E1E2C] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#7B61FF]"
                      />
                      <button
                        type="submit"
                        disabled={isSending || !replyInput.trim()}
                        className="px-3.5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>

                  {/* Customer Context Sidebar (Section 13) */}
                  <div className="space-y-4 text-xs font-sans">
                    <div className="border-b border-[#181824] pb-2 font-bold text-gray-300 uppercase font-mono tracking-wider">
                      Fiche Client & Context
                    </div>

                    {/* Customer Info Card */}
                    <div className="bg-[#0A0A10] border border-[#181824] p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">👤 Infos Client</span>
                        {selectedCustomer && (
                          <button
                            onClick={() => loadCustomerFiche(selectedCustomer)}
                            className="text-[10px] text-[#7B61FF] hover:underline"
                          >
                            Actualiser
                          </button>
                        )}
                      </div>

                      {selectedCustomer ? (
                        <div className="space-y-1 text-[11px] text-gray-300">
                          <p><span className="text-gray-500 font-mono">Nom:</span> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                          <p><span className="text-gray-500 font-mono">Tél:</span> {formatPhoneNumber(selectedCustomer.phone)}</p>
                          {selectedCustomer.city && <p><span className="text-gray-500 font-mono">Ville:</span> {selectedCustomer.city}</p>}
                          {selectedCustomer.email && <p><span className="text-gray-500 font-mono">Email:</span> {selectedCustomer.email}</p>}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 italic">Prospect non encore rattaché au CRM.</p>
                      )}
                    </div>

                    {/* Orders History Card */}
                    <div className="bg-[#0A0A10] border border-[#181824] p-3 rounded-xl space-y-2">
                      <span className="font-bold text-white text-xs block">📦 Commandes Client</span>
                      {customerOrders.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {customerOrders.map((ord) => (
                            <div key={ord.id} className="p-2 bg-[#12121A] rounded-lg border border-[#181824] flex items-center justify-between text-[11px]">
                              <div>
                                <p className="font-bold text-white">#{ord.order_number}</p>
                                <p className="text-[10px] text-gray-400">{Number(ord.total_amount || 0).toLocaleString()} XOF</p>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-mono">
                                {ord.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 italic">Aucune commande enregistrée.</p>
                      )}
                    </div>

                    {/* Ad Attribution Card */}
                    <div className="bg-[#0A0A10] border border-[#181824] p-3 rounded-xl space-y-2">
                      <span className="font-bold text-white text-xs block">🎯 Source & Attribution</span>
                      {customerAttributions.length > 0 ? (
                        <div className="space-y-1 text-[11px] text-gray-300">
                          <p><span className="text-gray-500 font-mono">Canal:</span> {customerAttributions[0].ad_platform || "Facebook Ads"}</p>
                          {customerAttributions[0].campaign_name && <p><span className="text-gray-500 font-mono">Campagne:</span> {customerAttributions[0].campaign_name}</p>}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 italic">WhatsApp Direct / Organique</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-3 flex flex-col items-center justify-center text-center p-12 space-y-3">
                  <MessageSquare className="w-12 h-12 text-gray-600" />
                  <h3 className="text-sm font-bold text-white">Aucune Conversation Sélectionnée</h3>
                  <p className="text-xs text-gray-400 max-w-sm">
                    Sélectionnez une conversation dans la liste de gauche pour lire les messages et échanger avec vos clients.
                  </p>
                </div>
              )}
            </div>
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
                      <td className="p-4 font-mono">{formatPhoneNumber(c.phone)}</td>
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
        </div>
      )}

      {/* TAB CONTENT: AGENT CONFIG */}
      {activeTab === "agent_config" && (
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#181824] pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#7B61FF]" />
              Configuration de l&apos;Agent IA Commercial
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Définissez l&apos;identité, les consignes métier et les règles d&apos;escalade pour l&apos;Agent IA.
            </p>
          </div>

          <form onSubmit={handleSaveAgentConfig} className="space-y-6 max-w-3xl">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Nom de l&apos;Agent</label>
                <input
                  type="text"
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white text-xs outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Instructions Personnalisées</label>
                <textarea
                  rows={4}
                  value={agentConfig.custom_instructions}
                  onChange={(e) => setAgentConfig({ ...agentConfig, custom_instructions: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white text-xs outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Ton</label>
                  <input
                    type="text"
                    value={agentConfig.tone}
                    onChange={(e) => setAgentConfig({ ...agentConfig, tone: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white text-xs outline-none focus:border-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Langue</label>
                  <input
                    type="text"
                    value={agentConfig.language}
                    onChange={(e) => setAgentConfig({ ...agentConfig, language: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white text-xs outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              Enregistrer la configuration
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: PLAYGROUND */}
      {activeTab === "playground" && (
        <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl p-6 space-y-4">
          <div className="border-b border-[#181824] pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" /> Playground de Test Agent IA
            </h2>
            <span className="text-xs text-gray-400 font-mono">PROMPT & TOOL TEST BENCH</span>
          </div>

          <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-[#0A0A10] rounded-xl border border-[#181824]">
            {playgroundMsgs.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs space-y-1 ${
                    msg.role === "user"
                      ? "bg-[#7B61FF] text-white rounded-br-none"
                      : "bg-[#181824] text-gray-200 border border-[#282838] rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-[10px] opacity-60 block text-right font-mono">{msg.time}</span>
                </div>
              </div>
            ))}

            {isPlaygroundThinking && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>L&apos;Agent IA prépare sa réponse...</span>
              </div>
            )}
          </div>

          <form onSubmit={handlePlaygroundSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={playgroundInput}
              onChange={(e) => setPlaygroundInput(e.target.value)}
              placeholder="Testez l'Agent IA avec une question client..."
              className="flex-1 bg-[#0A0A10] border border-[#282838] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={isPlaygroundThinking || !playgroundInput.trim()}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all disabled:opacity-50"
            >
              Tester
            </button>
          </form>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE CONVERSATIONS (SECTION 5) */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-red-500/30 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">
                {targetDeleteIds.length > 1
                  ? `Supprimer ${targetDeleteIds.length} conversations ?`
                  : "Supprimer cette conversation ?"}
              </h3>
            </div>

            {/* EXPLICIT DATA PRESERVATION WARNING (SECTION 4 & 5) */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs text-amber-200">
              <p className="font-bold flex items-center gap-1.5 text-amber-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Protection des données clients & commerciales :
              </p>
              <p className="leading-relaxed">
                Cette action supprimera l&apos;historique de conversation mais <strong>NE SUPPRIMERA PAS</strong> le client, les commandes, les paiements ou les livraisons associés dans le CRM.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setTargetDeleteIds([]);
                }}
                disabled={isActionProcessing}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConversationsConfirmed}
                disabled={isActionProcessing}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
              >
                {isActionProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT WHATSAPP MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" /> Connecter un Numéro WhatsApp
            </h3>

            <form onSubmit={handleConnectWhatsApp} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-300 block mb-1">Numéro WhatsApp *</label>
                <input
                  type="text"
                  placeholder="+226 70 00 00 00"
                  value={connectForm.phoneNumber}
                  onChange={(e) => setConnectForm({ ...connectForm, phoneNumber: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white outline-none focus:border-emerald-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">Nom d&apos;affichage</label>
                <input
                  type="text"
                  placeholder="WILLShop Commercial"
                  value={connectForm.displayName}
                  onChange={(e) => setConnectForm({ ...connectForm, displayName: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl"
                >
                  Connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2C] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#7B61FF]" /> Nouveau Client CRM
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-300 block mb-1">Prénom</label>
                  <input
                    type="text"
                    placeholder="Aminata"
                    value={customerForm.firstName}
                    onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white outline-none focus:border-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-300 block mb-1">Nom</label>
                  <input
                    type="text"
                    placeholder="Diallo"
                    value={customerForm.lastName}
                    onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">Téléphone *</label>
                <input
                  type="text"
                  placeholder="+226 77 00 00 00"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white outline-none focus:border-[#7B61FF] font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="aminata@example.bf"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#282838] rounded-xl p-3 text-white outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold rounded-xl"
                >
                  Créer le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
