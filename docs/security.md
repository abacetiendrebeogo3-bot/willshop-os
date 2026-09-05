# WILLShop OS — Security & Multi-Tenancy Architecture

## 1. Multi-Tenant Security Policy
- Every business entity contains `organization_id UUID NOT NULL REFERENCES public.organizations(id)`.
- **CRITICAL**: The client bundle (frontend) CANNOT specify, inject, or override `organization_id`.
- The organization context is resolved exclusively on the server side via `OrganizationContextService.getOrganizationContext()`.

## 2. Row Level Security (RLS) Strategy
- RLS is ENABLED on 100% of business tables.
- Security Definer helper functions:
  - `public.is_org_member(p_org_id UUID)`: Checks if the authenticated user (`auth.uid()`) belongs to the target organization.
  - `public.get_user_org_role(p_org_id UUID)`: Fetches the authenticated user's role.
- RLS policies prevent cross-tenant data leakage even if a raw query bypass occurs.

## 3. Central Audit Log
- All state mutations are captured in `public.audit_log`.
- Tracks: `actor_id`, `organization_id`, `action`, `target_entity`, `target_id`, `before_state`, `after_state`, `reason`, `correlation_id`, `ai_agent`, `ai_action`.
