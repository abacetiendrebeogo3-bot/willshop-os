# ADR 011: Marketing Engine — Real Contribution Profit, Attribution Transparency, and Provider Abstraction

- **Status**: ACCEPTED
- **Date**: 2026-09-05
- **Deciders**: Software Architect & Lead Engineer (WillShop OS)

## Context
WillShop OS requires a complete Marketing Engine (Build 10) connecting ad spend to actual cash receipts, delivered orders, and bottom-line contribution profits. Traditional marketing systems often confuse ROAS (Revenue / Spend) with real profitability, or hallucinate customer origins without evidence.

## Decision
We decide that the **Marketing Engine** must adhere to the following architectural rules:

1. **Real Contribution Profit & ROI**:
   - **ROAS**: `Attributed Revenue / Ad Spend`.
   - **ROI**: `Contribution Profit / Ad Spend`.
   - **Contribution Profit**: `Revenue - COGS - Ad Spend - Delivery Costs - Commissions - Other Variable Costs`.
2. **Provider Abstraction**: All external platform integrations (Meta Ads, Instagram, Facebook, Google Ads) stay strictly behind provider-agnostic interfaces (`IMarketingProviderAdapter`). Secret credentials are saved strictly server-side.
3. **Attribution & Transparency**: Attribution touchpoints (`first_touch`, `last_touch`, `primary_touch`, `whatsapp_source`, `manual`, `unknown`) are assigned explicit confidence levels (`HIGH`, `MEDIUM`, `LOW`). Unverified origins default to `ATTRIBUTION_UNKNOWN`.
4. **Funnel & Creative Intelligence**: Diagnostic services evaluate funnel conversion rates and flag creative fatigue (`WINNER`, `WATCH`, `LOSER`, `FATIGUE`) with sample volume safeguards (>= 1,000 impressions).
5. **CEO AI & Automation Integration**: Extends CEO AI Tool Registry (`get_marketing_snapshot`, `get_campaign_performance`, etc.) and dispatches system events (`marketing.performance_drop`, `marketing.creative_fatigue`, `marketing.roi_negative`).

## Consequences
- **Positive**: Complete executive clarity on real marketing profit vs vanity ad spend metrics. Auditable attribution and seamless CEO AI copilot integration.
- **Negative**: Requires strict attribution metadata collection across customer contact channels.
