-- WILLShop OS — BUILD 13 : WILTY PERSONAL OS MIGRATION
-- ABSOLUTE SEPARATION: Multi-Tenant RLS by user_id = auth.uid()

-- 1. Personal Profiles Table
CREATE TABLE IF NOT EXISTS personal_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    locale VARCHAR(10) NOT NULL DEFAULT 'fr',
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_personal_profile_user UNIQUE(user_id)
);

-- 2. Personal Goals Table
CREATE TABLE IF NOT EXISTS personal_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    category VARCHAR(50) NOT NULL DEFAULT 'LIFE',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rationale TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    timeframe VARCHAR(50) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    target_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    baseline_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    target_value NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    confidence VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    notes TEXT,
    milestones TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Personal Projects Table
CREATE TABLE IF NOT EXISTS personal_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    goal_id UUID REFERENCES personal_goals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    deadline TIMESTAMPTZ,
    budget NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    actual_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Personal Tasks Table
CREATE TABLE IF NOT EXISTS personal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    project_id UUID REFERENCES personal_projects(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES personal_goals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    due_date TIMESTAMPTZ,
    estimated_duration_minutes INT,
    actual_duration_minutes INT,
    recurring_frequency VARCHAR(50),
    source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Personal Habits Table
CREATE TABLE IF NOT EXISTS personal_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    goal_id UUID REFERENCES personal_goals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(50) NOT NULL DEFAULT 'DAILY',
    target_days_per_week INT NOT NULL DEFAULT 7,
    streak_count INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0,
    adherence_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    history_log TEXT[] DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Personal Learning Items Table
CREATE TABLE IF NOT EXISTS personal_learning_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    goal_id UUID REFERENCES personal_goals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'BOOK',
    resource_url TEXT,
    current_level VARCHAR(50) NOT NULL DEFAULT 'Beginner',
    target_level VARCHAR(50) NOT NULL DEFAULT 'Advanced',
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Personal Financial Accounts Table (Isolated Ledger)
CREATE TABLE IF NOT EXISTS personal_financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'CASH',
    currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    institution VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Personal Transactions Table
CREATE TABLE IF NOT EXISTS personal_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    account_id UUID NOT NULL REFERENCES personal_financial_accounts(id) ON DELETE CASCADE,
    target_account_id UUID REFERENCES personal_financial_accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'EXPENSE',
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    counterparty VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Personal Budgets Table
CREATE TABLE IF NOT EXISTS personal_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    category VARCHAR(100) NOT NULL,
    monthly_limit NUMERIC(15,2) NOT NULL,
    spent_current_month NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    period VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Personal Net Worth Snapshots Table
CREATE TABLE IF NOT EXISTS personal_net_worth_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assets_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    liabilities_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    net_worth NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    asset_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    liability_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Personal Investments Table
CREATE TABLE IF NOT EXISTS personal_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    asset_name VARCHAR(255) NOT NULL,
    asset_category VARCHAR(50) NOT NULL DEFAULT 'STOCKS',
    quantity NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    purchase_unit_price NUMERIC(15,2) NOT NULL,
    current_unit_price NUMERIC(15,2) NOT NULL,
    invested_capital NUMERIC(15,2) NOT NULL,
    current_valuation NUMERIC(15,2) NOT NULL,
    unrealized_gain_loss NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
    broker_account VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Personal Decisions Table
CREATE TABLE IF NOT EXISTS personal_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'personal',
    question VARCHAR(255) NOT NULL,
    context TEXT NOT NULL,
    options TEXT[] DEFAULT '{}',
    chosen_option VARCHAR(255) NOT NULL,
    rationale TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    actual_outcome TEXT,
    review_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACCEPTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Business ↔ Personal Bridge Records Table
CREATE TABLE IF NOT EXISTS business_personal_bridges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    direction VARCHAR(50) NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
    business_account_id UUID NOT NULL,
    personal_account_id UUID NOT NULL REFERENCES personal_financial_accounts(id) ON DELETE CASCADE,
    business_transaction_id UUID,
    personal_transaction_id UUID REFERENCES personal_transactions(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    approved_by_user_id UUID NOT NULL,
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_p_goals_user ON personal_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_p_tasks_user ON personal_tasks(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_p_habits_user ON personal_habits(user_id, status);
CREATE INDEX IF NOT EXISTS idx_p_accs_user ON personal_financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_p_txs_user ON personal_transactions(user_id, account_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_p_bridges_user ON business_personal_bridges(user_id, transfer_date);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE personal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_personal_bridges ENABLE ROW LEVEL SECURITY;

-- POLICIES (Strict user_id = auth.uid())
CREATE POLICY personal_profiles_isolation ON personal_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_goals_isolation ON personal_goals FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_projects_isolation ON personal_projects FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_tasks_isolation ON personal_tasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_habits_isolation ON personal_habits FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_learning_isolation ON personal_learning_items FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_accounts_isolation ON personal_financial_accounts FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_txs_isolation ON personal_transactions FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_budgets_isolation ON personal_budgets FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_nw_isolation ON personal_net_worth_snapshots FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_invs_isolation ON personal_investments FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_decisions_isolation ON personal_decisions FOR ALL USING (user_id = auth.uid());
CREATE POLICY personal_bridges_isolation ON business_personal_bridges FOR ALL USING (user_id = auth.uid());
