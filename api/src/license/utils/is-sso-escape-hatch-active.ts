import { getEntitlementManager } from '../index.js';
import { getLicenseManager } from '../manager.js';

/**
 * Whether SSO should remain reachable despite the `sso_enabled` entitlement being off.
 *
 * Acts as a lockout escape hatch: during lockdown we keep SSO routes open so admins
 * who only authenticate via a non-default provider can still sign in and resolve the
 * lockdown.
 */
export async function isSsoEscapeHatchActive(): Promise<boolean> {
	if (getEntitlementManager().isEntitled('sso_enabled')) return true;
	return getLicenseManager().isLocked();
}
