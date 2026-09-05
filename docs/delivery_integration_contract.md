# WILLShop OS — Delivery Integration Contract

## 1. Interaction Contract: Delivery ↔ Orders Engine

```
[Delivery Engine]                                [Orders Engine]
        │                                               │
        ├─── Complete Delivery (DELIVERED) ────────────►│ MarkOutForDeliveryService (SALE deduction)
        │                                               │
        ├─── Delivery Return (RETURNED + intact) ──────►│ ReturnOrderService (Stock reintegration)
        │                                               │
        └─── Delivery Cancelled ───────────────────────►│ CancelOrderService (Release reservation)
```

- Delivery Engine NEVER modifies `product_stock` directly.
- Delivery Engine invokes Orders application services to ensure single-owner domain integrity.
