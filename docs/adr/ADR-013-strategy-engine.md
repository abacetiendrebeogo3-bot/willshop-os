# ADR-013: Strategy & Goals Engine Architecture

* **Status**: Accepted
* **Date**: 2026-09-05
* **Author**: Senior Lead Architect — WillShop OS

## Context
WillShop OS required a strategic execution system to bridge the CEO's vision to daily execution across orientations, objectives, key results, initiatives, 90-day plans, risk matrices, decision reviews, and Stop/Start/Continue recommendations without creating duplicate financial ledgers or unbacked metrics.

## Decision
1. **Execution Chain Concept**: Implement the strategic execution chain:
   `VISION → ORIENTATIONS STRATÉGIQUES → OBJECTIFS → KEY RESULTS / KPI → INITIATIVES → PLANS → TÂCHES → RÉSULTATS → APPRENTISSAGE`.
2. **Live BI KPI Linking**: Connect `StrategicGoal` metrics directly to real BI Engine KPI keys (`revenue_month`, `contribution_profit`, `delivery_rate`, etc.). The CEO AI cannot arbitrarily mutate KPI values.
3. **Trajectory & Forecast Engine**: Compute expected progress vs actual progress timeline to determine trajectory status (`ON_TRACK` 🟢, `AT_RISK` 🟡, `OFF_TRACK` 🔴).
4. **Initiative Prioritization Formula**: Rank initiatives based on transparent formula:
   `Score = (Impact x 3) + (FinancialImpact x 2) - (Effort x 1.5) - (Risk x 1.5) + (Urgency x 1)`.
5. **Immutable Scenario Testing**: Execute What-If scenario simulations on immutable state copies without mutating production data.
6. **CEO AI Tools & System Events**: Register 12 structured CEO AI tools and emit 8 structured system events to Automation Engine (`strategy.goal_at_risk`, `strategy.initiative_blocked`, etc.).
7. **Multi-Tenant RLS Security**: Enforce `is_org_member(p_org_id)` on all PostgreSQL tables (`strategies`, `strategic_objectives`, `strategic_goals`, `key_results`, `initiatives`, `strategic_milestones`, `strategy_risks`, `strategic_assumptions`, `strategic_decisions`).

## Consequences
* WillShop OS possesses a comprehensive Strategy & Goals Engine.
* Strategic decisions and assumptions are logged with mandatory review dates.
* Execution alignment (% of active tasks/initiatives linked to strategy) is continuously monitored.
