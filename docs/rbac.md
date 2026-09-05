# WILLShop OS — Role-Based Access Control (RBAC) Matrix

## 1. Roles Hierarchy
1. **`OWNER` (CEO)**: Full operational, financial, strategic, and administrative access.
2. **`MANAGER`**: Operational, stock, sales, and team management. No org deletion or owner management.
3. **`COMMERCIAL`**: CRM, live conversations, order creation, customer records, stock reading.
4. **`LIVREUR`**: Assigned deliveries, delivery status updates, order reading.
5. **`VIEWER`**: Read-only access to CRM, stock, orders, and deliveries.

## 2. Server-Side Enforcement
Permissions are validated on the server via `hasPermission(role, action)` and `verifyPermission(ctx, action)` in the Domain and Application layers.
