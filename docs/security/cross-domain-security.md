# WillShop OS — Cross-Domain Security & Isolation Matrix

This document defines the strict security boundary between Business WillShop operations (`scope = business`) and Wilty Personal OS (`scope = personal`).

## 1. Domain Security Matrix

| Source Domain | Destination Domain | Default Policy | Enforced Mechanism | Exception / Authorized Pathway |
| :--- | :--- | :--- | :--- | :--- |
| **Business Finance** | **Personal Finance** | `BLOCKED` | RLS Policy + Service Scope Validation | `Authorized Bridge` (`BusinessPersonalBridgeRecord`) |
| **Personal Finance** | **Business Finance** | `BLOCKED` | RLS Policy + Service Scope Validation | `Authorized Bridge` (`BusinessPersonalBridgeRecord`) |
| **Business AI Engine**| **Personal Memory** | `BLOCKED` | Prompt Context & Memory Scope Isolation | None |
| **Personal AI Engine**| **Business Memory** | `BLOCKED` | Prompt Context & Memory Scope Isolation | None |
| **CEO AI Engine** | **Personal Data** | `BLOCKED` | RBAC + Strict Context Boundaries | Explicit user consent bridge |
| **Personal AI Engine**| **Business Data** | `BLOCKED` | Scope Isolation | None |
| **Authorized Bridge**| **Authorized Data** | `ALLOWED` | Cryptographic signature + Audit Log | Dual ledger entry recording |

## 2. Row Level Security (RLS) Rules

1. **Business Scope Policies**:
   ```sql
   CREATE POLICY business_domain_isolation ON orders
     FOR ALL TO authenticated
     USING (is_org_member(organization_id) AND scope = 'business');
   ```

2. **Personal Scope Policies**:
   ```sql
   CREATE POLICY personal_domain_isolation ON personal_assets
     FOR ALL TO authenticated
     USING (user_id = auth.uid() AND scope = 'personal');
   ```

## 3. Bridge Audit Protocol

When capital or assets move between Business and Personal contexts (e.g. CEO owner dividend transfer or personal capital injection):
1. **Bridge Record**: Created in `business_personal_bridges` with source account, target account, amount, currency, timestamp, and signature.
2. **Dual-Entry Transaction**: Emits two separate, audited financial entries: one in `transactions` (`scope = business`), one in `personal_transactions` (`scope = personal`).
3. **Audit Event**: Emits `BRIDGE_TRANSFER_EXEC` event with complete audit payload.
