-- ============================================================================
-- WILLShop OS — BUILD 02 DATA CORE MIGRATION
-- Migration: 20260905000002_data_core.sql
-- Description: Data Core tables, RLS policies, indexes, FKs, and check constraints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES FOR DATA CORE
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 
        'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 
        'CANCELLED', 'FAILED', 'RETURNED', 'RESCHEDULED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'RECEIVED', 'VERIFIED', 'RECONCILED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM (
        'PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 
        'DELIVERED', 'CLOSED', 'FAILED', 'RESCHEDULED', 'RETURNED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stock_movement_type AS ENUM ('RESERVATION', 'RELEASE', 'SALE', 'CANCELLATION', 'RESTOCK', 'ADJUSTMENT', 'RETURN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE financial_account_type AS ENUM ('CASH_REGISTER', 'BANK_ACCOUNT', 'MOBILE_MONEY', 'OTHER_PRO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE memory_type AS ENUM (
        'short_term', 'customer', 'business', 'marketing', 
        'decision', 'strategic', 'experience', 'personal'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE memory_scope AS ENUM ('business', 'personal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. CORE DOMAIN TABLES
-- ----------------------------------------------------------------------------

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(205) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NULL,
    whatsapp_phone VARCHAR(50) NULL,
    address TEXT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Ouagadougou',
    zone_id UUID NULL,
    notes TEXT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    notes TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    minimum_stock INT NOT NULL DEFAULT 5 CHECK (minimum_stock >= 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'piece',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT unique_org_sku UNIQUE (organization_id, sku)
);

-- 4. Product Stock Table (Source of truth for stock)
CREATE TABLE IF NOT EXISTS public.product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    physical_stock INT NOT NULL DEFAULT 0 CHECK (physical_stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    minimum_stock INT NOT NULL DEFAULT 5 CHECK (minimum_stock >= 0),
    available_stock INT GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_product_stock UNIQUE (organization_id, product_id),
    CONSTRAINT check_stock_reserved_within_physical CHECK (reserved_stock <= physical_stock)
);

-- 5. Stock Movements Table (Append-only Ledger)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type stock_movement_type NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('IN', 'OUT', 'RESERVE', 'RELEASE')),
    quantity INT NOT NULL CHECK (quantity > 0),
    reference_type VARCHAR(100) NULL,
    reference_id VARCHAR(255) NULL,
    reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL
);

-- 6. Zones Table
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Ouagadougou',
    delivery_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Zone FK to Customers
ALTER TABLE public.customers ADD CONSTRAINT fk_customers_zone FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE SET NULL;

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_number VARCHAR(100) NOT NULL,
    status order_status NOT NULL DEFAULT 'DRAFT',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    delivery_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    source VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP',
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT unique_org_order_number UNIQUE (organization_id, order_number)
);

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_order_product UNIQUE (order_id, product_id)
);

-- 9. Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    user_id UUID NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    vehicle VARCHAR(100) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Deliveries Table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT UNIQUE,
    driver_id UUID NULL REFERENCES public.drivers(id) ON DELETE SET NULL,
    zone_id UUID NULL REFERENCES public.zones(id) ON DELETE SET NULL,
    status delivery_status NOT NULL DEFAULT 'PENDING',
    delivery_address TEXT NOT NULL,
    delivery_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    assigned_at TIMESTAMPTZ NULL,
    picked_up_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    failed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    method payment_method NOT NULL DEFAULT 'CASH',
    status payment_status NOT NULL DEFAULT 'PENDING',
    provider VARCHAR(100) NULL,
    provider_reference VARCHAR(255) NULL,
    received_at TIMESTAMPTZ NULL,
    verified_at TIMESTAMPTZ NULL,
    reconciled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Financial Accounts Table (WILLSHOP BUSINESS FINANCE ONLY)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    type financial_account_type NOT NULL DEFAULT 'CASH_REGISTER',
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Transactions Table (Append-only Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    financial_account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    category VARCHAR(100) NOT NULL,
    reference_type VARCHAR(100) NULL,
    reference_id VARCHAR(255) NULL,
    description TEXT NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL
);

-- 14. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    user_id UUID NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'COMMERCIAL',
    employment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- 15. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    assigned_to UUID NULL REFERENCES public.employees(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    due_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL DEFAULT 'META_ADS',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (budget >= 0),
    start_at TIMESTAMPTZ NULL,
    end_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Creatives Table
CREATE TABLE IF NOT EXISTS public.creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    campaign_id UUID NULL REFERENCES public.campaigns(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'IMAGE',
    asset_url TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. AI Memories Table
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    memory_type memory_type NOT NULL,
    scope memory_scope NOT NULL DEFAULT 'business',
    subject_type VARCHAR(100) NOT NULL,
    subject_id VARCHAR(255) NULL,
    content TEXT NOT NULL,
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    source VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    expires_at TIMESTAMPTZ NULL,
    superseded_by UUID NULL REFERENCES public.ai_memories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_personal_scope_org CHECK (
        (scope = 'personal') OR (scope = 'business' AND organization_id IS NOT NULL)
    )
);

-- 19. AI Actions Table
CREATE TABLE IF NOT EXISTS public.ai_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    action_type VARCHAR(255) NOT NULL,
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('GREEN', 'YELLOW', 'RED')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    requested_by VARCHAR(100) NOT NULL DEFAULT 'CEO_AI',
    approved_by UUID NULL,
    approval_at TIMESTAMPTZ NULL,
    idempotency_key VARCHAR(255) NULL,
    correlation_id VARCHAR(255) NULL,
    input_summary TEXT NOT NULL,
    result_summary TEXT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ NULL,
    verified_at TIMESTAMPTZ NULL
);

-- 20. Goals / Strategy Table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'REVENUE',
    target_value NUMERIC(15, 2) NOT NULL,
    current_value NUMERIC(15, 2) NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'XOF',
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON public.customers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_products_org_sku ON public.products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_product_stock_org_product ON public.product_stock(organization_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_org_product ON public.stock_movements(organization_id, product_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_customer ON public.orders(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON public.orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_org_status ON public.deliveries(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_org_order ON public.payments(organization_id, order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_org_account ON public.transactions(organization_id, financial_account_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_org_scope ON public.ai_memories(organization_id, scope);
CREATE INDEX IF NOT EXISTS idx_ai_actions_org_status ON public.ai_actions(organization_id, status);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES ON DATA CORE TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Policies using is_org_member(organization_id)
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'customers', 'suppliers', 'products', 'product_stock', 'stock_movements',
        'zones', 'orders', 'order_items', 'drivers', 'deliveries', 'payments',
        'financial_accounts', 'transactions', 'employees', 'tasks', 'campaigns',
        'creatives', 'ai_actions', 'goals'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('
            CREATE POLICY %I_select ON public.%I FOR SELECT USING (public.is_org_member(organization_id));
            CREATE POLICY %I_insert ON public.%I FOR INSERT WITH CHECK (public.is_org_member(organization_id));
            CREATE POLICY %I_update ON public.%I FOR UPDATE USING (public.is_org_member(organization_id));
            CREATE POLICY %I_delete ON public.%I FOR DELETE USING (public.is_org_member(organization_id));
        ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Specialized RLS Policy for ai_memories (Handles personal vs business scope)
CREATE POLICY ai_memories_select ON public.ai_memories FOR SELECT USING (
    (scope = 'business' AND public.is_org_member(organization_id)) OR
    (scope = 'personal' AND auth.uid() IS NOT NULL)
);

CREATE POLICY ai_memories_insert ON public.ai_memories FOR INSERT WITH CHECK (
    (scope = 'business' AND public.is_org_member(organization_id)) OR
    (scope = 'personal' AND auth.uid() IS NOT NULL)
);

CREATE POLICY ai_memories_update ON public.ai_memories FOR UPDATE USING (
    (scope = 'business' AND public.is_org_member(organization_id)) OR
    (scope = 'personal' AND auth.uid() IS NOT NULL)
);
