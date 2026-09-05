# ADR-014: Wilty Personal OS Architecture & Business/Personal Isolation

* **Status**: Accepted
* **Date**: 2026-09-05
* **Author**: Senior Lead Architect — WillShop OS

## Context
Willy Tiendré required a dedicated Personal Operating System (Wilty Personal OS) to manage personal life, personal finances, goals, habits, learning, projects, decision journal, and Wilty Personal AI. It was essential to guarantee **ABSOLUTE SEPARATION** between WillShop Business (`scope = business`) and Wilty Personal OS (`scope = personal`).

## Decision
1. **Scope Boundary**: Enforce explicit `scope = personal` on all personal entities (`PersonalProfile`, `PersonalGoal`, `PersonalProject`, `PersonalTask`, `PersonalHabit`, `PersonalLearningItem`, `PersonalFinancialAccount`, `PersonalTransaction`, `PersonalBudget`, `PersonalNetWorthSnapshot`, `PersonalInvestmentPosition`, `PersonalDecision`).
2. **Isolated Financial Ledger**: Build a completely separate Personal Finance Ledger. Personal financial accounts and transactions are isolated from WillShop business `financial_accounts` and general ledgers.
3. **Explicit Bridge Transfers**: The ONLY gateway between Business and Personal is an explicit, double-entry audited bridge transfer (`business_to_personal_transfer` / `personal_to_business_contribution`).
4. **Context Isolation**: `PersonalAIContextProvider` filters and asserts `scope = personal` on all entities before generating AI context for Wilty Personal AI. Personal data is blocked from business CEO AI and business data is blocked from Wilty Personal AI.
5. **Multi-Tenant RLS Security**: Enforce `user_id = auth.uid()` RLS policies on all 13 PostgreSQL tables created for Build 13.

## Consequences
* Wilty Personal OS operates seamlessly with total privacy and data security.
* Zero contamination between personal net worth/finances and WillShop business accounting.
* Full auditability across personal habits, daily briefings, weekly reviews, and bridge transfers.
