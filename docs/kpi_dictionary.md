# WILLShop OS — KPI Dictionary & Standard Definitions

## Overview
Centralized, immutable definitions for all key performance indicators used in WillShop OS.

| KPI Key | Name | Formula / Query | Unit | Freshness | Source Module |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `revenue` | Chiffre d'Affaires | `SUM(orders.total) WHERE status IN ('DELIVERED', 'COMPLETED')` | FCFA | REALTIME | ORDERS |
| `orders_count` | Nombre de Commandes | `COUNT(orders.id)` | COUNT | REALTIME | ORDERS |
| `aov` | Panier Moyen | `Revenue / COUNT(completed_orders)` | FCFA | REALTIME | ORDERS |
| `cogs` | Coût Marchandises | `SUM(order_items.quantity * products.purchase_price)` | FCFA | REALTIME | STOCK |
| `gross_profit` | Marge Brute | `Revenue - COGS` | FCFA | REALTIME | FINANCE |
| `delivery_success_rate` | Taux Succès Livraison | `(COUNT(delivered) / COUNT(total)) * 100` | PERCENTAGE | REALTIME | DELIVERY |
| `cash_balance` | Trésorerie Totale | `SUM(financial_accounts.current_balance)` | FCFA | REALTIME | FINANCE |
