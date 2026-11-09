import type { Directus, LicenseStatus } from '@directus/license';
import { getEntitlementManager } from '../index.js';
import { isInCoreGracePeriod } from './is-in-core-grace-period.js';

/**
 * Compute the operational license status
 *
 * | license | withinLimits | coreGrace |      expires     | Outcome                                       | id |
 * | ------- | ------------ | --------- | ---------------- | --------------------------------------------- | -- |
 * |    n    |      n       |     y     |        -         | grace - core upgrade grace bypasses limits    | A  |
 * |    n    |      n       |     n     |        -         | locked - core over limits                     | B  |
 * |    n    |      y       |     *     |        -         | active - core within limits                   | C  |
 * |    y    |      n       |     -     |        *         | locked - over entitlement limits              | D  |
 * |    y    |      y       |     -     | none or future   | active - license not expired                  | E  |
 * |    y    |      y       |     -     | past, in grace   | grace - expired but within license grace      | F  |
 * |    y    |      y       |     -     | past grace       | active - awaiting the manager's downgrade     | G  |
 *
 * `expiry` is `expires_at`, falling back to `renews_at`. A grace period of -1 never ends.
 */
export async function computeLicenseStatus(license: Directus.License | null): Promise<LicenseStatus> {
	const entitlementManager = getEntitlementManager().fork(license?.entitlements ?? null);

	const isWithinLimits = await entitlementManager.checkAll();

	if (!license) {
		if (isWithinLimits === false) {
			// CASE A
			if (await isInCoreGracePeriod()) return 'grace';

			// CASE B
			return 'locked';
		}

		// CASE C
		return 'active';
	}

	// CASE D
	if (isWithinLimits === false) return 'locked';

	// Now in seconds
	const now = Math.floor(Date.now() / 1000);
	const expires = license.meta.expires_at ?? license.meta.renews_at ?? -1;
	const grace = license.meta.grace_period;

	// CASE E
	if (expires === -1 || now < expires) return 'active';

	// CASE F
	if (grace === -1 || grace + expires > now) return 'grace';

	// CASE G - stay 'active' until the manager's downgrade lands rather than break
	return 'active';
}
