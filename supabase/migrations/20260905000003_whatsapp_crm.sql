-- ============================================================================
-- WILLShop OS — BUILD 03 WHATSAPP + CRM / SALES MIGRATION
-- Migration: 20260905000003_whatsapp_crm.sql
-- Description: WhatsApp numbers, conversations, messages, leads, tags, notes, human handoffs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES FOR WHATSAPP + CRM
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('OPEN', 'PENDING', 'WAITING_CUSTOMER', 'WAITING_AGENT', 'CLOSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE message_direction AS ENUM ('INBOUND', 'OUTBOUND');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE message_sender_type AS ENUM ('CUSTOMER', 'AI', 'HUMAN', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'TEMPLATE', 'INTERACTIVE', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE handoff_status AS ENUM ('PENDING', 'ASSIGNED', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. WHATSAPP & CRM TABLES
-- ----------------------------------------------------------------------------

-- 1. WhatsApp Numbers Table
CREATE TABLE IF NOT EXISTS public.whatsapp_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    phone_number VARCHAR(50) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'META_CLOUD_API',
    provider_phone_number_id VARCHAR(255) NOT NULL,
    provider_business_account_id VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_phone_number UNIQUE (organization_id, phone_number)
);

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    customer_id UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL,
    whatsapp_number_id UUID NULL REFERENCES public.whatsapp_numbers(id) ON DELETE SET NULL,
    external_conversation_id VARCHAR(255) NULL,
    status conversation_status NOT NULL DEFAULT 'OPEN',
    channel VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP',
    assigned_user_id UUID NULL,
    assigned_agent VARCHAR(100) NOT NULL DEFAULT 'SALES_AI',
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unread_count INT NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    customer_id UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL,
    direction message_direction NOT NULL,
    sender_type message_sender_type NOT NULL,
    sender_id VARCHAR(255) NULL,
    message_type message_type NOT NULL DEFAULT 'TEXT',
    content TEXT NULL,
    media_url TEXT NULL,
    media_type VARCHAR(100) NULL,
    external_message_id VARCHAR(255) NULL,
    reply_to_message_id VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    error_code VARCHAR(100) NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ NULL,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Leads / Opportunities Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    conversation_id UUID NULL REFERENCES public.conversations(id) ON DELETE SET NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'WHATSAPP_INBOUND',
    status lead_status NOT NULL DEFAULT 'NEW',
    score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    assigned_to UUID NULL,
    estimated_value NUMERIC(15, 2) NULL DEFAULT 0.00 CHECK (estimated_value >= 0),
    product_interest VARCHAR(255) NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_tag_name UNIQUE (organization_id, name)
);

-- 6. Customer Tags Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.customer_tags (
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_id, tag_id)
);

-- 7. Conversation Tags Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.conversation_tags (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, tag_id)
);

-- 8. Customer Internal Notes Table
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    author_id UUID NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Human Handoffs Table
CREATE TABLE IF NOT EXISTS public.human_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    requested_by VARCHAR(100) NOT NULL DEFAULT 'SALES_AI',
    assigned_to UUID NULL,
    reason TEXT NOT NULL,
    status handoff_status NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-THROUGHPUT SEARCH
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON public.conversations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON public.messages(organization_id, external_message_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON public.leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_customer ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON public.customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_human_handoffs_status ON public.human_handoffs(organization_id, status);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_handoffs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
    crm_tables text[] := ARRAY[
        'whatsapp_numbers', 'conversations', 'messages', 'leads', 'tags',
        'customer_notes', 'human_handoffs'
    ];
BEGIN
    FOREACH tbl IN ARRAY crm_tables LOOP
        EXECUTE format('
            CREATE POLICY %I_select ON public.%I FOR SELECT USING (public.is_org_member(organization_id));
            CREATE POLICY %I_insert ON public.%I FOR INSERT WITH CHECK (public.is_org_member(organization_id));
            CREATE POLICY %I_update ON public.%I FOR UPDATE USING (public.is_org_member(organization_id));
            CREATE POLICY %I_delete ON public.%I FOR DELETE USING (public.is_org_member(organization_id));
        ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Policies for join tables (customer_tags & conversation_tags)
CREATE POLICY customer_tags_select ON public.customer_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND public.is_org_member(c.organization_id))
);

CREATE POLICY customer_tags_insert ON public.customer_tags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND public.is_org_member(c.organization_id))
);

CREATE POLICY conversation_tags_select ON public.conversation_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversations conv WHERE conv.id = conversation_id AND public.is_org_member(conv.organization_id))
);

CREATE POLICY conversation_tags_insert ON public.conversation_tags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversations conv WHERE conv.id = conversation_id AND public.is_org_member(conv.organization_id))
);
