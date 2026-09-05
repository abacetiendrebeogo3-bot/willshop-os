# WILLShop OS — System Architecture Document

## 1. Executive Summary
WILLShop OS is a High-Fidelity Intelligent E-Commerce Operating System built for WillShop and designed to be Multi-Tenant Ready for African entrepreneurs. It follows a **Modular Monolith** architecture with strict separation between Presentation, Application, Domain, and Infrastructure layers.

## 2. Architecture Layers

### Layer 1 — Experience (Presentation)
- **Framework**: Next.js 14 App Router, React 18, Tailwind CSS.
- **Role**: Executive Cockpits, Dashboards, and UI Components.
- **Constraint**: Presentation components NEVER talk directly to the database or external APIs. They invoke Server Actions or Route Handlers.

### Layer 2 — Intelligence (Moteurs & AI)
- **Deterministic Engines**: Stock Engine, Delivery Engine, Team Engine.
- **LLM Agents**: CEO AI, Sales AI, Finance AI, Marketing AI, Strategy AI, Wilty AI.
- **AI Gateway**: Provider-agnostic abstraction interface (`IAIGateway`) ensuring zero vendor lock-in.

### Layer 3 — Business Engines (Domain & Application)
- **Domain**: Pure TypeScript entities and domain errors (`AppErrors.ts`).
- **Application**: Use Cases, Context Resolvers (`OrganizationContextService`), Audit (`AuditService`), Event Dispatcher (`EventDispatcherService`), Idempotency (`IdempotencyService`).

### Layer 4 — Data Core (Database & Storage)
- **Database**: Supabase / PostgreSQL with Row-Level Security (RLS) on 100% of business tables.
- **Storage**: Supabase Storage for WhatsApp media files.

### Layer 5 — Integration (Adapters)
- **Adapters**: Isolated adapter pattern for WhatsApp Cloud API, Meta Ads, Mobile Money Gateways, Delivery APIs, AI Providers.

## 3. Key Principles
- **No ORM**: Raw SQL migrations and Supabase query builders.
- **Server-Side Security**: RLS & Server-side context resolution. Client cannot choose `organization_id`.
- **Atomic PostgreSQL RPCs**: All critical stock and order mutations run as PostgreSQL transaction RPCs.
