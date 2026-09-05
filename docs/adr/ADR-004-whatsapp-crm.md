# ADR-004: WhatsApp Integration & CRM Sales Agent Architecture

## Status
Accepted

## Context
WILLShop OS requires a WhatsApp integration for live customer conversations, lead qualification, and AI Sales Agent responses. WillShop possesses existing Meta Developer / WhatsApp Cloud API infrastructure.

## Decision Standards
1. **Provider Abstraction**:
   - `IWhatsAppProvider` interface decouples domain logic from Meta Cloud API or external gateways.
   - `MetaWhatsAppAdapter` lives in Infrastructure.
2. **Idempotency on Webhooks**:
   - Incoming webhook messages enforce idempotency based on `external_message_id` within the organization to avoid duplicate message creation on Meta retries.
3. **Phone Normalization & Customer Lookup**:
   - Phone numbers are normalized into E.164 format (`+226...`) before performing `organization_id` + `phone` customer lookups.
4. **Media & Storage Handling**:
   - Media files (images, audio, documents) are stored in Supabase Storage. Only secure URLs and metadata are stored in `messages` and passed to the LLM context. NEVER base64 in prompts or DB.
5. **AI Sales Agent Constraints**:
   - Sales Agent NEVER invents product prices, stock levels, or discounts. All pricing data must originate from the Data Core catalog.
   - Triggers `HumanHandoff` when confidence is insufficient, or when explicit human requests/refund requests occur.
