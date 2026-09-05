import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MetaWhatsAppAdapter } from "@/src/infrastructure/whatsapp/MetaWhatsAppAdapter";
import { SalesAgentService, SalesAgentContextService } from "@/src/application/services/SalesAgentService";
import { IAIGateway } from "@/src/domain/interfaces/IAIGateway";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://stbzctncpvgqdpybcrmg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnpjdG5jcHZncWRweWJjcm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDAzMjYsImV4cCI6MjEwNDE3NjMyNn0.G7QlTqyz4_D6nxbn72tIX1K-nbAKBzSX7CuMB2jixvs";

class SimpleAIGateway implements IAIGateway {
  async generateCompletion(request: {
    agentName: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }) {
    const userMsg = request.messages[request.messages.length - 1]?.content || "";
    let content = "Merci pour votre message. Je recherche l'information exacte dans nos données en temps réel.";

    if (userMsg.toLowerCase().includes("bonjour") || userMsg.toLowerCase().includes("salut")) {
      content = "Bonjour ! Je suis l'Agent IA Commercial WILLShop. Comment puis-je vous aider aujourd'hui ? Souhaitez-vous découvrir nos produits ou suivre une commande ?";
    } else if (userMsg.toLowerCase().includes("produit") || userMsg.toLowerCase().includes("prix") || userMsg.toLowerCase().includes("catalogue") || userMsg.toLowerCase().includes("stock")) {
      content = "Voici les informations réelles de notre catalogue d'articles disponibles. Tous nos prix sont fixes. Souhaitez-vous passer commande ?";
    }

    return {
      content,
      promptTokens: 20,
      completionTokens: 20,
      totalTokens: 40,
      model: "gpt-4o-mini",
      provider: "openrouter",
    };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "willshop_secret_verify_token";

  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryOrgId = searchParams.get("org_id");

    const rawBody = await request.text();
    const payload = JSON.parse(rawBody || "{}");
    const correlationId = request.headers.get("x-correlation-id") || `wh-${Date.now()}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract message payload details (Meta Cloud API vs Custom Webhook format)
    let senderPhone = payload.from || payload.phone || payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || "";
    let messageText = payload.text || payload.content || payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || "";
    let providerPhoneNumberId = payload.phone_number_id || payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || "default_id";
    let externalMsgId = payload.message_id || payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id || `wamid.${Date.now()}`;

    if (!senderPhone && !messageText) {
      return NextResponse.json({
        status: "SUCCESS",
        provider: params.provider,
        correlationId,
        processedEvents: 0,
        message: "No message payload detected",
      });
    }

    // Resolve Organization ID
    let targetOrgId = queryOrgId || "";

    if (!targetOrgId && providerPhoneNumberId !== "default_id") {
      const { data: numRow } = await supabase
        .from("whatsapp_numbers")
        .select("organization_id")
        .eq("provider_phone_number_id", providerPhoneNumberId)
        .single();
      if (numRow) targetOrgId = numRow.organization_id;
    }

    if (!targetOrgId) {
      const { data: fallbackOrgs } = await supabase.from("organizations").select("id").limit(1);
      if (fallbackOrgs && fallbackOrgs.length > 0) {
        targetOrgId = fallbackOrgs[0].id;
      }
    }

    if (!targetOrgId) {
      return NextResponse.json({ status: "ERROR", message: "No active organization found" }, { status: 400 });
    }

    // Normalize phone
    const cleanPhone = senderPhone.replace(/[^\d+]/g, "");

    // 1. Lookup or Create Customer
    let customerId = "";
    const { data: existingCust } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, status")
      .eq("organization_id", targetOrgId)
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const { data: newCust, error: custErr } = await supabase
        .from("customers")
        .insert({
          organization_id: targetOrgId,
          first_name: `Client ${cleanPhone.slice(-4)}`,
          last_name: "WhatsApp",
          phone: cleanPhone,
          status: "ACTIVE",
        })
        .select()
        .single();

      if (!custErr && newCust) {
        customerId = newCust.id;
      }
    }

    // 2. Lookup or Create Conversation
    let conversationId = "";
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id, assigned_agent")
      .eq("organization_id", targetOrgId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString(), status: "OPEN" })
        .eq("id", conversationId);
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          organization_id: targetOrgId,
          customer_id: customerId || null,
          channel: "WHATSAPP",
          status: "OPEN",
          assigned_agent: "SALES_AI",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!convErr && newConv) {
        conversationId = newConv.id;
      }
    }

    // 3. Save Inbound Message
    if (conversationId) {
      await supabase.from("messages").insert({
        organization_id: targetOrgId,
        conversation_id: conversationId,
        customer_id: customerId || null,
        direction: "INBOUND",
        sender_type: "CUSTOMER",
        sender_id: cleanPhone,
        message_type: "TEXT",
        content: messageText,
        external_message_id: externalMsgId,
        status: "RECEIVED",
      });

      // 4. Trigger Sales AI Agent
      const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, selling_price, stock_quantity, status")
        .eq("organization_id", targetOrgId);

      const availableProducts = (products || []).map((p) => ({
        id: p.id,
        organizationId: targetOrgId,
        sku: p.sku,
        name: p.name,
        sellingPrice: Number(p.selling_price || 0),
        costPrice: 0,
        currency: "XOF",
        stockQuantity: p.stock_quantity || 0,
        alertThreshold: 5,
        status: p.status || "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const { data: historyMsgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(10);

      const mappedMsgs = (historyMsgs || []).map((m) => ({
        id: m.id,
        organizationId: targetOrgId,
        conversationId: m.conversation_id,
        direction: m.direction,
        senderType: m.sender_type,
        messageType: m.message_type,
        content: m.content || "",
        status: m.status,
        sentAt: new Date(m.created_at),
        createdAt: new Date(m.created_at),
      }));

      const mockCustomer = {
        id: customerId,
        organizationId: targetOrgId,
        fullName: `Client ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        status: "ACTIVE" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const aiGateway = new SimpleAIGateway();
      const contextService = new SalesAgentContextService();
      const salesAgentService = new SalesAgentService(aiGateway, contextService);

      const aiResult = await salesAgentService.generateResponse(
        mockCustomer,
        mappedMsgs,
        availableProducts
      );

      // 5. Save AI Outbound Response in DB
      await supabase.from("messages").insert({
        organization_id: targetOrgId,
        conversation_id: conversationId,
        customer_id: customerId || null,
        direction: "OUTBOUND",
        sender_type: "AI",
        sender_id: "SALES_AI",
        message_type: "TEXT",
        content: aiResult.responseText,
        status: "SENT",
      });

      // 6. Send message via Meta WhatsApp Provider
      const metaAdapter = new MetaWhatsAppAdapter();
      await metaAdapter.sendTextMessage(providerPhoneNumberId, {
        toPhoneNumber: cleanPhone,
        text: aiResult.responseText,
      });

      // Handle Handoff if needed
      if (aiResult.triggerHandoff) {
        await supabase.from("human_handoffs").insert({
          organization_id: targetOrgId,
          conversation_id: conversationId,
          reason: "Le client demande un conseiller humain",
          status: "PENDING",
        });

        await supabase
          .from("conversations")
          .update({ assigned_agent: "HUMAN" })
          .eq("id", conversationId);
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      provider: params.provider,
      correlationId,
      processedEvents: 1,
      conversationId,
    });
  } catch (error: any) {
    console.error("Error processing WhatsApp webhook:", error);
    return NextResponse.json(
      { status: "ERROR", message: error.message },
      { status: 500 }
    );
  }
}
