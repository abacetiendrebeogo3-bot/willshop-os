# WILLShop OS — Build 10: Marketing Intelligence & Engine Architecture

## 1. Executive Summary
The **Marketing Engine** connects the complete commercial marketing loop:
`PUBLICITÉ -> LEAD -> CONVERSATION -> COMMANDE -> LIVRAISON -> PAIEMENT -> CA -> COÛT -> MARGE -> ROI`.

---

## 2. Core Architecture
- **MarketingCampaign & AdAccount**: Tracks campaign objectives, platform, budgets, and attributed revenue/orders.
- **ProfitabilityEngine**: Computes Gross Profit, Contribution Profit (`Revenue - COGS - AdSpend - DeliveryCosts`), ROAS, and ROI.
- **MarketingAttributionService**: Matches orders/payments to campaigns with touchpoints (`first_touch`, `last_touch`, `primary_touch`, `whatsapp_source`, `manual`, `unknown`) and confidence scores.
- **MarketingFunnelService**: Analyzes funnel conversion rates and produces bottleneck diagnostics.
- **CreativeIntelligenceService**: Classifies creatives into `WINNER` 🟢, `WATCH` 🟡, `LOSER` 🔴, `FATIGUE` ⚠️.
- **MarketingBudgetService**: Tracks budget pacing, remaining balance, and overspend alerts.

---

## 3. Integration with CEO AI & Automation
- Registers marketing tools in CEO AI Tool Registry (`get_marketing_snapshot`, `get_campaign_performance`, `get_creative_performance`, `get_marketing_funnel`).
- Dispatches system events (`marketing.campaign_started`, `marketing.performance_drop`, `marketing.creative_fatigue`, `marketing.roi_negative`).

---

## 4. Security & RLS
All database tables (`ad_accounts`, `marketing_campaigns`, `ad_sets`, `advertisements`, `marketing_creatives`, `marketing_spends`, `marketing_attributions`, `marketing_experiments`) enforce multi-tenant isolation via PostgreSQL Row Level Security (RLS) policies checking `is_org_member(organization_id)`.
