-- WILLShop OS — BUILD 12 : STRATEGY & GOALS ENGINE MIGRATION
-- Multi-Tenant RLS & Performance Indexes

-- 1. Strategies Table
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vision TEXT NOT NULL,
    mission TEXT,
    strategic_period VARCHAR(50) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    owner_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Strategic Objectives Table
CREATE TABLE IF NOT EXISTS strategic_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    strategic_priority VARCHAR(50) NOT NULL DEFAULT 'P2_HIGH',
    owner_id UUID NOT NULL,
    timeframe VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ON_TRACK',
    parent_objective_id UUID REFERENCES strategic_objectives(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Strategic Goals Table
CREATE TABLE IF NOT EXISTS strategic_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    objective_id UUID REFERENCES strategic_objectives(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    team_id UUID,
    goal_type VARCHAR(50) NOT NULL DEFAULT 'STRATEGIC',
    kpi_key VARCHAR(100),
    baseline_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    baseline_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_value NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    start_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ON_TRACK',
    confidence VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    forecast_value NUMERIC(15,2),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Key Results Table
CREATE TABLE IF NOT EXISTS key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_value NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ON_TRACK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Initiatives Table
CREATE TABLE IF NOT EXISTS initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    objective_id UUID REFERENCES strategic_objectives(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES strategic_goals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    team_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    strategic_impact VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    expected_financial_impact NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    urgency VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    effort VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    prioritization_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    budget NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    actual_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    expected_revenue NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    expected_profit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    expected_roi NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    start_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Strategic Milestones Table
CREATE TABLE IF NOT EXISTS strategic_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    evidence TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Strategy Risks Table
CREATE TABLE IF NOT EXISTS strategy_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    objective_id UUID REFERENCES strategic_objectives(id) ON DELETE SET NULL,
    initiative_id UUID REFERENCES initiatives(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    probability VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    impact VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    risk_score INT NOT NULL DEFAULT 4,
    mitigation_plan TEXT NOT NULL,
    owner_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    review_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Strategic Assumptions Table
CREATE TABLE IF NOT EXISTS strategic_assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    kpi_key VARCHAR(100),
    threshold_condition VARCHAR(255) NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Strategic Decisions Table
CREATE TABLE IF NOT EXISTS strategic_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    context TEXT NOT NULL,
    options TEXT[] DEFAULT '{}',
    chosen_option VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    actual_outcome TEXT,
    owner_id UUID NOT NULL,
    decision_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACCEPTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_strategies_org ON strategies(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_strat_objs_org ON strategic_objectives(organization_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_strat_goals_org ON strategic_goals(organization_id, kpi_key, status);
CREATE INDEX IF NOT EXISTS idx_initiatives_org ON initiatives(organization_id, goal_id, status);
CREATE INDEX IF NOT EXISTS idx_strat_risks_org ON strategy_risks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_strat_decisions_org ON strategic_decisions(organization_id, review_date);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_decisions ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY strategies_org_isolation ON strategies FOR ALL USING (is_org_member(organization_id));
CREATE POLICY strat_objs_org_isolation ON strategic_objectives FOR ALL USING (is_org_member(organization_id));
CREATE POLICY strat_goals_org_isolation ON strategic_goals FOR ALL USING (is_org_member(organization_id));
CREATE POLICY key_results_org_isolation ON key_results FOR ALL USING (is_org_member(organization_id));
CREATE POLICY initiatives_org_isolation ON initiatives FOR ALL USING (is_org_member(organization_id));
CREATE POLICY milestones_org_isolation ON strategic_milestones FOR ALL USING (is_org_member(organization_id));
CREATE POLICY strat_risks_org_isolation ON strategy_risks FOR ALL USING (is_org_member(organization_id));
CREATE POLICY strat_assumptions_org_isolation ON strategic_assumptions FOR ALL USING (is_org_member(organization_id));
CREATE POLICY strat_decisions_org_isolation ON strategic_decisions FOR ALL USING (is_org_member(organization_id));
