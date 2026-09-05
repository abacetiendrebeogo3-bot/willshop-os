# WillShop OS — Team & Productivity Engine Architecture & Technical Manual

## Overview
The **Team & Productivity Engine (Build 11)** serves as the central execution engine of WillShop OS. It bridges company objectives with daily employee tasks, workloads, contextual performance evaluations, goal tracking, and automated escalations.

---

## Core Execution Loop
```
OBJECTIF → RESPONSABLE → TÂCHE → EXÉCUTION → PREUVE → RÉSULTAT → ÉVALUATION
```

---

## Domain Architecture & Entities

### Entities (`src/domain/entities/TeamEntities.ts`)
- **`TeamEmployee`**: Extends base employee concept with `role` (`OWNER`, `MANAGER`, `COMMERCIAL`, `LIVREUR`, `VIEWER`), `employmentStatus` (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`), skills, responsibilities, and `activityStatus`.
- **`TeamTask`**: Rich task entity with priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), status (`BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `CANCELLED`, `ARCHIVED`), source (`MANUAL`, `CEO_AI`, `AUTOMATION`, `ORDER`, `DELIVERY`, `CUSTOMER`, `MARKETING`, `FINANCE`, `STOCK`, `GOAL`, `SYSTEM`), entity linking, dependencies, and blocker reasons.
- **`TaskDependency`**: Maps parent/child prerequisite task relationships.
- **`TeamGoal`**: Connects company goals to team and employee goals with status (`ON_TRACK`, `AT_RISK`, `OFF_TRACK`, `ACHIEVED`, `FAILED`, `CANCELLED`).
- **`WorkloadSummary`**: Classifies employee workload as `UNDERUTILIZED`, `BALANCED`, or `OVERLOADED`.
- **`EmployeePerformanceScorecard`**: Context-aware scorecard calculating activity, reliability, goal, quality, and result scores with explicit safeguards and confidence ratings.
- **`EscalationRecord`**: Tracks multi-level task escalations (Level 1: 24h, Level 2: 48h, Level 3: 72h).

---

## Domain Services
- `TaskStateMachine`: Governs status transitions and dependency checks.
- `TaskAssignmentService`: Recommends optimal employee assignment based on role, skills, and workload.
- `WorkloadService`: Computes open, urgent, overdue, and blocked tasks to calculate workload scores.
- `DailyWorkPlanService`: Categorizes daily tasks into Urgent/Overdue, Important, and Regular items with a top priority recommendation.
- `TeamBriefingService`: Aggregates team execution stats and top process bottlenecks for managers/CEO.
- `EmployeePerformanceService`: Evaluates performance with contextual safeguards (e.g. low lead volume buffers score).
- `EscalationService`: Triggers multi-tier overdue task escalations without duplicate notification spam.
- `ProcessBottleneckEngine`: Pinpoints recurring delays across domain sources (`ORDER`, `DELIVERY`, `STOCK`, `PAYMENT`, `MARKETING`).

---

## CEO AI Tools & System Events
### Registered Tools in `AIToolRegistry`:
1. `get_team_snapshot`
2. `get_employee_workload`
3. `get_overdue_tasks`
4. `get_blocked_tasks`
5. `get_goal_progress`
6. `get_employee_scorecard`
7. `get_team_performance`
8. `get_work_plan`

### System Events Dispatched to Automation Engine:
- `team.task_overdue`
- `team.task_blocked`
- `team.goal_at_risk`
- `team.workload_high`
- `team.performance_drop`
- `team.escalation_required`

---

## Security & Isolation
- Multi-Tenant RLS enforced via `is_org_member(organization_id)` on all PostgreSQL tables.
- RBAC permissions enforced across `OWNER`, `MANAGER`, `COMMERCIAL`, `LIVREUR`, `VIEWER` roles.
