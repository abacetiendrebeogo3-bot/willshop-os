# WILLSHOP OS — MON CLOSEUR CONTROLLED MIGRATION PIPELINE

This document defines the 7-step zero-downtime controlled data migration pipeline for onboarding legacy Mon Closeur customer, product, and order records into WillShop OS.

---

## 🛑 SAFETY GUARANTEE

> **NO DESTRUCTIVE OR UNVERIFIED AUTOMATIC MIGRATION IS EVER EXECUTED.**
> All legacy data must pass through the mandatory 7-stage validation pipeline before reaching production tables.

---

## 🔄 7-STAGE MIGRATION PIPELINE

```
1. SOURCE EXPRESSION
   Extract legacy Mon Closeur CSV / JSON export.
      ↓
2. SCHEMA MAPPING
   Map legacy fields to WillShop OS Data Core entities.
      ↓
3. DETERMINISTIC VALIDATION
   Verify phone numbers, prices, duplicate SKUs, invalid statuses.
      ↓
4. INTERACTIVE PREVIEW
   Generate migration preview report with diffs & anomaly flags.
      ↓
5. EXPLICIT APPROVAL
   Require CEO / Lead Operator sign-off before DB insert.
      ↓
6. ATOMIC BATCH IMPORT
   Execute transactional batch insert with rollback savepoints.
      ↓
7. POST-IMPORT AUDIT & VERIFICATION
   Run DataConsistencyEngine to verify zero data loss & zero financial drift.
```

---

## 📋 ENTITY MAPPING & INGESTION RULES

### 1. Customers (`mon_closeur_contacts` -> `customers`)
- **Phone Normalization:** All raw phone strings normalized to E.164 format (e.g., `70000001` -> `+22670000001`).
- **Deduplication Rule:** Existing customers matched by normalized phone number. If match exists, merge tags/notes without overwriting existing orders.

### 2. Products (`mon_closeur_items` -> `products` & `product_stocks`)
- **SKU Mapping:** Map legacy item code to `sku`. Standardize uppercase alphanumeric string.
- **Price Integrity:** `sellingPrice` and `purchasePrice` converted to integer XOF amount. Reject entries with missing or negative prices.
- **Stock Initialization:** Create initial `product_stock` entry with `physicalStock = legacy_qty`, `reservedStock = 0`.

### 3. Orders & Payments (`mon_closeur_sales` -> `orders` & `payments`)
- **Historical Orders:** Imported with status `COMPLETED`.
- **Payment Linkage:** For each completed sale, record corresponding `payment` (`status = 'VERIFIED'`) and `financial_transaction` (`category = 'PRODUCT_SALE'`).

---

## 🚫 EXCLUDED DATA (DO NOT IMPORT)

- ❌ Duplicate or incomplete contact numbers (`00000000`).
- ❌ Legacy API keys, passwords, or session tokens.
- ❌ Corrupted transaction records with missing totals.
- ❌ Unused legacy system logs and temp tables.

---

## 🛡️ ROLLBACK PROCEDURE

Every migration batch is assigned a unique `migration_batch_id`. If post-import validation fails:
```sql
DELETE FROM orders WHERE metadata->>'migration_batch_id' = 'batch_20260905_01';
DELETE FROM payments WHERE metadata->>'migration_batch_id' = 'batch_20260905_01';
DELETE FROM customers WHERE metadata->>'migration_batch_id' = 'batch_20260905_01';
```
PostgreSQL transaction savepoints guarantee clean rollback without affecting pre-existing operational data.
