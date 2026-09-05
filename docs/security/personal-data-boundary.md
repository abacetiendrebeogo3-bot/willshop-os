# Wilty Personal OS — Security & Data Boundary Specification

## Security Principles
1. **Server-Side Enforcement**: All boundary policies are enforced server-side. Client parameters (`user_id`, `scope`) are never trusted without server-side resolution via `auth.uid()`.
2. **Database Row Level Security (RLS)**:
   ```sql
   ALTER TABLE personal_financial_accounts ENABLE ROW LEVEL SECURITY;
   CREATE POLICY personal_accounts_isolation ON personal_financial_accounts
     FOR ALL USING (user_id = auth.uid());
   ```
3. **AI Context Isolation**:
   `PersonalAIContextProvider.assertPersonalScopeOnly(entities)` explicitly verifies that zero business entities contaminate the Wilty Personal AI context window.
4. **Audited Bridge Transfers**:
   Transfers between business org accounts and personal accounts require double-entry audit records (`business_personal_bridges`).
