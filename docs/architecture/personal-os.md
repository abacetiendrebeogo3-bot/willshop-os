# Wilty Personal OS — Architecture Manual

## Overview
**Wilty Personal OS (Build 13)** is the Life Cockpit for Willy Tiendré. It centralizes personal goals, projects, tasks, routines & habits, learning items, decision journal, personal finance, net worth calculation, and Wilty Personal AI.

---

## Business ↔ Personal Boundary Architecture
- **Business Scope**: `scope = 'business'`. Governed by WillShop OS organization context (`is_org_member(p_org_id)`).
- **Personal Scope**: `scope = 'personal'`. Governed by user identity (`user_id = auth.uid()`).
- **Bridge**: Controlled via `BusinessPersonalBridgeRecord` (`OWNER_DRAW` / `CAPITAL_INJECTION`).

---

## Core Personal Sub-Domains
1. **Personal Profile**: Identity, timezone, locale, notification preferences.
2. **Personal Goals**: Goals across 10 categories with progress tracking and trajectory status.
3. **Personal Projects & Tasks**: Projects with budgets, milestones, linked tasks (`TODO`, `IN_PROGRESS`, `DONE`).
4. **Personal Habits**: Routines, streaks, adherence rates over 30-day windows.
5. **Personal Learning**: Skills, courses, books, target levels.
6. **Personal Finance**: Append-only transaction ledger, account balances, budgets, net worth snapshots (`Assets - Liabilities`), investment positions.
7. **Decision Journal**: Decision logging, options, rationale, expected vs actual outcome reviews.
8. **Wilty Personal AI**: Daily Briefing, Weekly Review (STOP/START/CONTINUE), Personal AI Context Provider.
