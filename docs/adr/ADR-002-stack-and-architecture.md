# ADR-002: Next.js 14 App Router & Supabase Stack

## Status
Accepted

## Context
Need a modern, fast, server-first fullstack architecture with strong security.

## Decision
Use Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage, RPC), Vercel.

---

# ADR-003: No ORM (Prisma/Drizzle) Policy

## Status
Accepted

## Context
ORMs introduce overhead, slow down raw SQL migrations, and interfere with complex atomic PostgreSQL transaction RPCs.

## Decision
No Prisma, Drizzle, or external ORMs. Use native Supabase query builder for CRUD and PostgreSQL RPC functions for critical transactional logic.

---

# ADR-004: Modular Monolith Architecture

## Status
Accepted

## Context
Avoid premature microservices overhead while maintaining strict domain separation.

## Decision
Structure application as a Modular Monolith with 4 layers: Presentation -> Application -> Domain -> Infrastructure.
