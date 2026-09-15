/**
 * WILLShop OS — Anti-Pollution Test Guardrail & Sandbox Isolation
 * Prevents automated scripts and integration tests from targeting or mutating
 * the live commercial / pilot organization ID ('27f3fcc3-402b-4294-ae19-ee4e59ed4037').
 */

export const REAL_COMMERCIAL_ORG_ID = '27f3fcc3-402b-4294-ae19-ee4e59ed4037';
export const SANDBOX_TEST_ORG_ID = '00000000-0000-4000-a000-000000000000';

/**
 * Asserts that the target organization ID is NOT the live commercial organization.
 * Throws an explicit Error if a script or integration test attempts to write to the live commercial org.
 */
export function assertNotCommercialOrg(orgId: string, context = 'Integration Test'): void {
  if (!orgId) return;
  const targetNorm = orgId.trim().toLowerCase();
  const realNorm = REAL_COMMERCIAL_ORG_ID.toLowerCase();

  if (targetNorm === realNorm) {
    throw new Error(
      `[ANTI-POLLUTION SAFEGUARD BLOCKED] ${context} tried to target live commercial organization ID '${REAL_COMMERCIAL_ORG_ID}'. Tests MUST write strictly to a sandbox organization ID (e.g. '${SANDBOX_TEST_ORG_ID}').`
    );
  }
}
