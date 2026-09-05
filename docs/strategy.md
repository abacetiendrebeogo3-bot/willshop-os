# WillShop OS — Strategy & Goals Engine Architecture & Technical Manual

## Overview
The **Strategy & Goals Engine (Build 12)** connects the CEO's vision to daily execution. It organizes vision, strategic orientations, objectives, key results, initiatives, 90-day plans, risk matrices, decision reviews, and evidence-backed recommendations.

---

## Core Strategic Execution Chain
```
VISION → ORIENTATIONS STRATÉGIQUES → OBJECTIFS → KEY RESULTS / KPI → INITIATIVES → PLANS → TÂCHES → RÉSULTATS → APPRENTISSAGE
```

---

## Domain Architecture & Entities

### Entities (`src/domain/entities/StrategyEntities.ts`)
- **`Strategy`**: Organizational vision, mission, strategic period (e.g. "Q3-Q4 2026"), and status (`DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`).
- **`StrategicObjective`**: Objectives with strategic priority (`P1_CRITICAL`, `P2_HIGH`, `P3_MEDIUM`) and timeframe.
- **`StrategicGoal`**: Extended goals linked to real BI KPI keys (`revenue_month`, `contribution_profit`, etc.), baseline, target, current value, unit, forecast, and trajectory status (`ON_TRACK`, `AT_RISK`, `OFF_TRACK`, `ACHIEVED`, `FAILED`).
- **`KeyResult`**: Measurable sub-targets with weights.
- **`Initiative`**: Strategic projects with calculated `prioritizationScore`, expected revenue, profit, and ROI.
- **`StrategicMilestone`**: Step progress tracking for initiatives with evidence.
- **`StrategyRisk`**: Risk items scored via Probability x Impact matrix (1 to 9).
- **`StrategicAssumption`**: Key business assumptions with threshold conditions.
- **`StrategicDecision`**: Logged decisions with context, chosen option, expected outcome, and mandatory review date.

---

## Domain Services
- `GoalProgressService`: Calculates progress %, remaining, elapsed time %, and expected progress.
- `TrajectoryEngine`: Evaluates actual vs expected trajectory (`ON_TRACK` 🟢, `AT_RISK` 🟡, `OFF_TRACK` 🔴).
- `StrategicPrioritizationService`: Ranks initiatives using `(Impact x 3) + (Financial x 2) - (Effort x 1.5) - (Risk x 1.5) + (Urgency x 1)`.
- `StrategicRiskMatrixService`: Computes Probability x Impact score to populate risk matrix data.
- `StrategicAlignmentEngine`: Analyzes execution tasks/initiatives for alignment with strategy.
- `StopStartContinueEngine`: Generates evidence-backed recommendations for 🛑 STOP, 🚀 START, and ⚡ CONTINUE.
- `StrategicHealthEngine`: Computes overall Strategy Health Score (0-100) across 7 dimensions.

---

## CEO AI Tools & System Events
### Registered Tools in `AIToolRegistry`:
1. `get_strategy_snapshot`
2. `get_strategic_objectives`
3. `get_goal_progress`
4. `get_goal_forecast`
5. `get_key_results`
6. `get_initiatives`
7. `get_initiative_score`
8. `get_strategy_risks`
9. `get_strategy_dependencies`
10. `get_90_day_plan`
11. `get_strategy_roadmap`
12. `get_strategic_decisions`

### System Events Dispatched to Automation Engine:
- `strategy.goal_at_risk`
- `strategy.goal_off_track`
- `strategy.initiative_blocked`
- `strategy.milestone_overdue`
- `strategy.risk_high`
- `strategy.assumption_invalidated`
- `strategy.forecast_deteriorated`
- `strategy.decision_review_due`

---

## Security & Isolation
- Multi-Tenant RLS enforced via `is_org_member(organization_id)` on all PostgreSQL tables.
- All strategy scope is strictly business-oriented (`scope = business`). Wilty Personal OS is reserved for Build 13.
