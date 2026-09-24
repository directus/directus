import type { Directus, LicenseStatus } from '@directus/license';
import { getEntitlementManager } from '../index.js';
import { isInCoreGracePeriod } from './is-in-core-grace-period.js';

/**
 * Compute the operational license status.
 */
export async function computeLicenseStatus(license: Directus.License | null): Promise<LicenseStatus> {
	const entitlementManager = getEntitlementManager().fork(license?.entitlements ?? null);

	const isWithinLimits = await entitlementManager.checkAll();

	if (!license) {
		// The core upgrade grace period allowes one to bypasses limit checks
		const isWithinCoreGracePeriod = await isInCoreGracePeriod();
		if (isWithinLimits === false && isWithinCoreGracePeriod) return 'grace';

		if (isWithinLimits === false) return 'locked';

		return 'active';
	}

	if (isWithinLimits === false) return 'locked';

	// current time in seconds
	const now = Math.floor(Date.now() / 1000);
	const expires = license.meta.expires_at ?? license.meta.renews_at ?? -1;
	const grace = license.meta.grace_period;

	if (expires === -1 || now < expires) return 'active';
	if (grace === -1 || grace + expires > now) return 'grace';

	/**
	 * Past expiry and grace period.
	 *
	 * The manager caches the license and downgrades it eventually, keep reporting 'active'
	 * until that downgrade lands rather than leave it in broken state
	 */
	return 'active';
}
