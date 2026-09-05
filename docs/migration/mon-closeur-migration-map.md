# Mon Closeur Legacy Migration Mapping Matrix

This document defines the technical schema mapping, data transformations, and deduplication rules for future ingestion of legacy data from **Mon Closeur** into **WillShop OS**.

> **IMPORTANT**: No legacy data is ingested during Build 14. This document guarantees schema readiness for future migration pipelines.

## 1. Schema Mapping Matrix

| Legacy Entity (Mon Closeur) | Target SSOT Entity (WillShop OS) | Key Transformation & Mapping Rules | Handling Missing / Legacy Fields |
| :--- | :--- | :--- | :--- |
| `mc_contacts` | `customers` | Map `mc_phone` $\to$ `phone_number` (E.164 format normalization), `mc_name` $\to$ `full_name`. Deduplicate by `phone_number` + `organization_id`. | Set `source = 'MON_CLOSEUR_MIGRATION'`. Legacy metadata stored in `metadata` JSONB. |
| `mc_threads` | `conversations` | Map `mc_thread_id` $\to$ `external_id`, `mc_customer_id` $\to$ `customer_id`. Preserves channel type `WHATSAPP`. | Default `status = 'CLOSED'`. |
| `mc_messages` | `whatsapp_messages` | Map `mc_body` $\to$ `content`, `mc_timestamp` $\to$ `created_at`, direction `inbound`/`outbound`. | Attach `correlation_id = 'mig_mc_' || mc_msg_id`. |
| `mc_catalog_items` | `product_stock` | Map `mc_item_code` $\to$ `sku`, `mc_title` $\to$ `name`, `mc_qty` $\to$ `quantity_available`. | Default `reserved_quantity = 0`, `reorder_threshold = 10`. |
| `mc_deals` | `orders` | Map `mc_deal_amount` $\to$ `total_amount`, `mc_stage` $\to$ `status` (`CONFIRMED`, `DELIVERED`, `CANCELLED`). | Calculate `cogs_amount` using historical catalog unit costs. |
| `mc_payments` | `payments` | Map `mc_pay_amount` $\to$ `amount`, `mc_pay_date` $\to$ `created_at`, `mc_ref` $\to$ `reference_id`. | Map payment method to standard enum (`MOBILE_MONEY`, `CASH`, `BANK_TRANSFER`). |

## 2. Validation & Sanity Rules

1. **Deduplication Strategy**: Matching existing `phone_number` merges contact metadata without overwriting active conversation threads.
2. **Double-Posting Guard**: Ingested legacy orders do NOT re-trigger live WhatsApp webhook notifications or live driver dispatches.
3. **Historical Financial Reconciliation**: Ingested legacy payments generate historical ledger entries marked with `is_historical_migration = true`.
