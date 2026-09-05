# ADR-001: Server-Side Multi-Tenancy Resolution & RLS

## Status
Accepted

## Context
WILLShop OS requires multi-tenancy support for future SaaS expansion while running WillShop as the single initial active tenant.

## Decision
1. All business tables require `organization_id UUID NOT NULL REFERENCES public.organizations(id)`.
2. Context resolution (`organization_id`) must occur strictly server-side (`OrganizationContextService.getOrganizationContext()`) using Supabase Auth JWT.
3. Client payload CANNOT dictate `organization_id`.
4. RLS is enforced at database level via `is_org_member(p_org_id)`.
