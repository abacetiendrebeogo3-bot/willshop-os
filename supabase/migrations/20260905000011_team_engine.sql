-- WILLShop OS — BUILD 11 : TEAM & PRODUCTIVITY ENGINE MIGRATION
-- Multi-Tenant RLS & Performance Indexes

-- 1. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    leader_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Team Employees Table (Extends base employee concept)
CREATE TABLE IF NOT EXISTS team_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'COMMERCIAL',
    employment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    manager_id UUID REFERENCES team_employees(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    skills TEXT[] DEFAULT '{}',
    responsibilities TEXT[] DEFAULT '{}',
    activity_status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Team Tasks Table
CREATE TABLE IF NOT EXISTS team_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    created_by UUID NOT NULL,
    assigned_to UUID REFERENCES team_employees(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    parent_task_id UUID REFERENCES team_tasks(id) ON DELETE CASCADE,
    blocker_reason TEXT,
    blocked_by UUID REFERENCES team_employees(id) ON DELETE SET NULL,
    blocked_at TIMESTAMPTZ,
    recurrence VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES team_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES team_tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

-- 5. Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES team_tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Task Activities Table
CREATE TABLE IF NOT EXISTS task_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES team_tasks(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Team Goals Table
CREATE TABLE IF NOT EXISTS team_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL DEFAULT 'COMPANY',
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES team_employees(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES team_goals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_value NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    start_date TIMESTAMPTZ NOT NULL,
    target_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ON_TRACK',
    forecast_value NUMERIC(15,2),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Task Escalations Table
CREATE TABLE IF NOT EXISTS task_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES team_tasks(id) ON DELETE CASCADE,
    escalation_level INT NOT NULL,
    reason TEXT NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_employees_org ON team_employees(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_team_tasks_org_assigned ON team_tasks(organization_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_team_tasks_due_at ON team_tasks(organization_id, due_at);
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_team_goals_org ON team_goals(organization_id, scope);
CREATE INDEX IF NOT EXISTS idx_escalations_task ON task_escalations(task_id, status);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_escalations ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY teams_org_isolation ON teams FOR ALL USING (is_org_member(organization_id));
CREATE POLICY team_employees_org_isolation ON team_employees FOR ALL USING (is_org_member(organization_id));
CREATE POLICY team_tasks_org_isolation ON team_tasks FOR ALL USING (is_org_member(organization_id));
CREATE POLICY task_deps_org_isolation ON task_dependencies FOR ALL USING (is_org_member(organization_id));
CREATE POLICY task_comments_org_isolation ON task_comments FOR ALL USING (is_org_member(organization_id));
CREATE POLICY task_activities_org_isolation ON task_activities FOR ALL USING (is_org_member(organization_id));
CREATE POLICY team_goals_org_isolation ON team_goals FOR ALL USING (is_org_member(organization_id));
CREATE POLICY task_escalations_org_isolation ON task_escalations FOR ALL USING (is_org_member(organization_id));
