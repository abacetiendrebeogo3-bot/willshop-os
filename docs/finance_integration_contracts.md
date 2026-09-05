# WILLShop OS — Finance Engine Integration Contracts

## 1. Orders Engine ↔ Finance Engine
- **Event**: `order.completed` or `payment.verified`
- **Action**: Invocations of `PostPaymentToFinanceService`.
- **Payload**: `{ orderId, paymentId, amount, financialAccountId, category: 'PRODUCT_SALE' }`
- **Result**: Posts an `INFLOW` transaction under `PRODUCT_SALE` to the specified financial account.

## 2. Delivery Engine ↔ Finance Engine
- **Event**: `delivery.delivered` / `delivery.closed`
- **Action**:
  - `DELIVERY_FEE_COLLECTED`: Recorded as `INFLOW` when customer pays for delivery fee.
  - `DELIVERY_COST`: Recorded as `OUTFLOW` when driver/carrier is paid.
- **Delivery Margin**: `DELIVERY_FEE_COLLECTED` - `DELIVERY_COST`.

## 3. Stock Engine ↔ Finance Engine
- **Event**: `stock.sale`
- **Action**: COGS (Cost of Goods Sold) calculation based on snapshot purchase cost (`purchasePrice` / `unitCostSnapshot`).
- **Gross Profit**: `PRODUCT_SALE` Revenue - `COGS`.
