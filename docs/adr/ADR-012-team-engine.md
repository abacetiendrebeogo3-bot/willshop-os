# ADR-012: Team & Productivity Engine Architecture

* **Status**: Accepted
* **Date**: 2026-09-05
* **Author**: Senior Lead Architect — WillShop OS

## Context
WillShop OS required a central execution engine to manage team members, role responsibilities, task life cycles, workload balancing, daily work plans, contextual performance scorecards, task escalations, and goal tracking without expanding into an overly complex HR ERP, payroll system, or standalone video chat software.

## Decision
1. **Execution Loop Concept**: Implement the core execution chain:
   `OBJECTIF → RESPONSABLE → TÂCHE → EXÉCUTION → PREUVE → RÉSULTAT → ÉVALUATION`.
2. **Task State Machine**: Enforce deterministic status transitions (`BACKLOG` -> `TODO` -> `IN_PROGRESS` -> `DONE`, `IN_PROGRESS` -> `BLOCKED` -> `IN_PROGRESS`) with strict dependency checks preventing tasks from being completed if prerequisite tasks remain undone.
3. **Contextual Performance Safeguards**: Evaluate employee performance scorecards using domain-specific KPIs while incorporating contextual safeguards (e.g. low lead volume or difficult delivery routes prevent automatic negative labeling of employee competence).
4. **Multi-Level Escalation Engine**: Implement 3-tier escalation thresholds (24h overdue -> Level 1 reminder, 48h -> Level 2 manager escalation, 72h -> Level 3 CEO escalation) with idempotent deduplication to prevent notification spam.
5. **CEO AI & Automation Integration**: Register 8 structured CEO AI tools (`get_team_snapshot`, `get_employee_workload`, `get_overdue_tasks`, `get_blocked_tasks`, `get_goal_progress`, `get_employee_scorecard`, `get_team_performance`, `get_work_plan`) and emit structured system events (`team.task_overdue`, `team.task_blocked`, `team.goal_at_risk`, `team.workload_high`, `team.performance_drop`, `team.escalation_required`).
6. **Multi-Tenant RLS Security**: Enforce `is_org_member(p_org_id)` on all PostgreSQL tables (`teams`, `team_employees`, `team_tasks`, `task_dependencies`, `task_comments`, `task_activities`, `team_goals`, `task_escalations`).

## Consequences
* WillShop OS possesses a robust, execution-focused Team & Productivity Engine.
* Zero cross-tenant data leakage or unauthorized access across employee scorecards or tasks.
* Full alignment across CEO AI recommendations, Automation workflows, and team daily execution.
