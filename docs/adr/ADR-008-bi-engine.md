# ADR 008 — BI Engine as Pure Analytical Layer

## Status
Accepted

## Context
WillShop OS requires an intelligence layer capable of aggregating performance metrics across Sales, Stock, Delivery, Finance, and Customer modules without creating duplicate data stores or violating single-source-of-truth ownership.

## Decision
1. **Single Source of Truth Preservation**: The BI Engine is strictly a read-only analytical layer. Operational modules (Orders, Stock, Delivery, Finance) remain the sole owners of their respective data domain. BI aggregates, calculates ratios, detects anomalies, and generates insights.
2. **Deterministic Mathematical Processing**: Mathematical calculations (KPIs, trend comparisons, variance percentages, anomaly detection) are executed deterministically in pure TypeScript and SQL views. No Generative AI or LLM is used to compute quantitative figures.
3. **Evidence Transparency & Confidence Scoring**: Every generated insight MUST attach structured evidence (source data, timeframe, observed variance, calculation details) and a confidence score (`LOW`, `MEDIUM`, `HIGH`).
4. **Security & RLS Isolation**: Analytical functions (`bi_product_performance_summary`, `bi_delivery_performance_summary`, etc.) are declared `SECURITY DEFINER` with explicit `SET search_path = public, pg_temp` and mandatory `is_org_member(p_org_id)` parameter validation.

## Consequences
- Guarantees 100% data consistency between operational dashboards and executive reports.
- Prevents LLM hallucinations on financial/sales numbers.
- Ensures total multi-tenant RLS isolation for analytics across WillShop OS.
