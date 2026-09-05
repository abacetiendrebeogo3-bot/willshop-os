# WILLShop OS — Delivery State Machine Specification

## 1. Allowed Status Transitions

```
[PENDING] ──► [ASSIGNED] ──► [PICKED_UP] ──► [IN_TRANSIT] ──► [DELIVERED] ──► [CLOSED]
    │             │              │                │               │
    ├─► CANCELLED ├─► CANCELLED  ├─► FAILED       ├─► FAILED      └─► RETURNED
    │             ├─► FAILED     └─► RETURNED     └─► RETURNED
    │             └─► RESCHEDULED
    │
    └─► [FAILED] ──► [RESCHEDULED] ──► [ASSIGNED]
```

## 2. Invalid Transition Safeguards
Illegal state jumps (e.g., `PENDING` -> `DELIVERED` or `CLOSED` -> `ASSIGNED`) are rejected with `ValidationError`.
