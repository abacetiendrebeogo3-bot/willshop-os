# WILLShop OS — Database Architecture & Data Core Specification

## 1. Core Principles
- Single source of truth for all business engines.
- Multi-tenancy via `organization_id UUID NOT NULL REFERENCES public.organizations(id)`.
- RLS enabled on 100% of tables.

## 2. Complete Entity Map (20 Entities)

| Entity | Table Name | Key Attributes | Constraints / Notes |
| :--- | :--- | :--- | :--- |
| **Customers** | `customers` | `id`, `org_id`, `first_name`, `last_name`, `phone`, `city`, `zone_id` | `full_name` generated stored. `ON DELETE RESTRICT` |
| **Suppliers** | `suppliers` | `id`, `org_id`, `name`, `phone`, `email` | Soft delete support |
| **Products** | `products` | `id`, `org_id`, `sku`, `name`, `purchase_price`, `selling_price` | `UNIQUE(org_id, sku)`. CHECK non-negative prices |
| **Product Stock** | `product_stock` | `id`, `org_id`, `product_id`, `physical_stock`, `reserved_stock` | Source of truth. `available_stock = physical - reserved`. `UNIQUE(org_id, product_id)` |
| **Stock Movements** | `stock_movements` | `id`, `org_id`, `product_id`, `type`, `direction`, `quantity` | Append-only ledger. `direction IN ('IN','OUT','RESERVE','RELEASE')` |
| **Orders** | `orders` | `id`, `org_id`, `customer_id`, `order_number`, `status`, `total` | `UNIQUE(org_id, order_number)`. Statuts from DRAFT to RETURNED |
| **Order Items** | `order_items` | `id`, `org_id`, `order_id`, `product_id`, `quantity`, `snapshots` | `UNIQUE(order_id, product_id)`. Snapshots name/SKU |
| **Payments** | `payments` | `id`, `org_id`, `order_id`, `amount`, `method`, `status`, `provider` | Provider ref for idempotency. Statuts PENDING -> RECONCILED |
| **Zones** | `zones` | `id`, `org_id`, `name`, `city`, `delivery_fee` | Default Ouagadougou |
| **Drivers** | `drivers` | `id`, `org_id`, `user_id`, `name`, `phone`, `vehicle` | Optional user link |
| **Deliveries** | `deliveries` | `id`, `org_id`, `order_id`, `driver_id`, `zone_id`, `status` | `UNIQUE(order_id)` prevents multiple active deliveries |
| **Financial Accounts**| `financial_accounts`| `id`, `org_id`, `name`, `type`, `opening_balance` | WILLSHOP BUSINESS ONLY (Caisse, Bank, Mobile Money) |
| **Transactions** | `transactions` | `id`, `org_id`, `financial_account_id`, `type`, `amount` | Append-only financial ledger |
| **Employees** | `employees` | `id`, `org_id`, `user_id`, `name`, `phone`, `role` | Staff roster |
| **Tasks** | `tasks` | `id`, `org_id`, `assigned_to`, `title`, `priority`, `status` | Action items |
| **Campaigns** | `campaigns` | `id`, `org_id`, `name`, `platform`, `budget`, `status` | Marketing campaigns |
| **Creatives** | `creatives` | `id`, `org_id`, `campaign_id`, `name`, `asset_url` | Ad creative assets |
| **AI Memories** | `ai_memories` | `id`, `org_id`, `memory_type`, `scope`, `content` | Scopes: `business` vs `personal`. Versioned with `superseded_by` |
| **AI Actions** | `ai_actions` | `id`, `org_id`, `action_type`, `permission_level`, `status` | Permission levels: `GREEN`, `YELLOW`, `RED` |
| **Goals** | `goals` | `id`, `org_id`, `name`, `target_value`, `current_value` | Corporate OKRs & targets |
