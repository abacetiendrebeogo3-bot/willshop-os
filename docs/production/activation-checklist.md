# WILLSHOP OS — PRODUCTION ACTIVATION CHECKLIST

This checklist establishes the pre-flight requirements and verification procedures before activating the WillShop OS Real-World Pilot environment.

---

## 1. ENVIRONMENT & INFRASTRUCTURE

| Item | Requirement | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **ENV-01** | Production Supabase project created (`willshop-prod-01`) | Dashboard inspection & connection ping | ✅ PASSED |
| **ENV-02** | Database region set to `eu-west-3` or closest low-latency region | Latency test (<100ms API response) | ✅ PASSED |
| **ENV-03** | PostgreSQL extensions enabled (`uuid-ossp`, `pgcrypto`) | Database migration script output | ✅ PASSED |
| **ENV-04** | Vercel production deployment configured | Production build validation | ✅ PASSED |
| **ENV-05** | Custom production domain linked with SSL certificate | HTTPS handshake verification | ✅ PASSED |

---

## 2. SECRETS & ENVIRONMENT VARIABLES

| Secret / Config Key | Scope | Production Setting Rules | Verified |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client/Server | Official HTTPS project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Anon key for public client queries | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server ONLY | Service role key for administrative functions. **NEVER in Git/Client** | ✅ |
| `META_WHATSAPP_TOKEN` | Server ONLY | Meta Graph API permanent access token | ✅ |
| `META_WHATSAPP_PHONE_ID` | Server ONLY | Meta registered phone number ID | ✅ |
| `META_WEBHOOK_VERIFY_TOKEN` | Server ONLY | Custom secret phrase for webhook handshake | ✅ |
| `META_APP_SECRET` | Server ONLY | App secret used for `x-hub-signature-256` verification | ✅ |
| `OPENAI_API_KEY` | Server ONLY | API Key for LLM reasoning engines | ✅ |
| `ENVIRONMENT` | Server | Set explicitly to `PILOT` or `PRODUCTION` | ✅ |

---

## 3. ROW LEVEL SECURITY (RLS) & ISOLATION POLICIES

- [x] RLS enabled on all core tables: `customers`, `products`, `orders`, `deliveries`, `payments`, `transactions`, `automation_rules`, `strategies`, `personal_profiles`, `personal_accounts`.
- [x] Tenant isolation policy verified: Every query filters by `organization_id = current_setting('app.current_org_id')`.
- [x] Domain isolation policy verified: `scope = personal` tables accessible ONLY when `current_setting('app.current_scope') = 'personal'` and matching user ID.
- [x] Service role key restricted to server-side background handlers and webhook receivers.

---

## 4. STORAGE & MEDIA BUCKETS

- [x] Bucket `payment-receipts` created with private access policy (signed URLs required).
- [x] Bucket `product-images` created with public read access.
- [x] Bucket `chat-media` created with authenticated team access policy.

---

## 5. MONITORING & LOGGING

- [x] Error monitoring initialized (Sentry or log aggregator).
- [x] Correlation ID propagation enabled across API routes and webhooks (`x-correlation-id`).
- [x] Audit log storage configured in PostgreSQL with 90-day retention policy.
- [x] Uptime monitoring pinging `/api/health` every 60 seconds.

---

## 6. PRE-LAUNCH VERIFICATION EXECUTION

```bash
# 1. Run type checks
npm run typecheck

# 2. Run automated test suite
npm test

# 3. Compile production build
npm run build
```

**Approval Sign-off:** Lead Architect & CEO Willy Tiendré  
**Date:** September 5, 2026
