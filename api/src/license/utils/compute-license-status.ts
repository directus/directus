import type { License, LicenseStatus } from '@directus/license';
import { getEntitlementManager } from '../index.js';
import { getCoreGracePeriod } from './get-core-grace-period.js';

/**
 * Compute the operational license status.
 */
export async function computeLicenseStatus(license: License | null): Promise<LicenseStatus> {
	const entitlementManager = getEntitlementManager().fork(license?.entitlements ?? null);

	if (!license) {
		// The core upgrade grace period allowes one to bypasses limit checks
		// Ideally enough time to obtain a license
		const isWithinCoreGracePeriod = await getCoreGracePeriod();
		if (isWithinCoreGracePeriod) return 'grace';

		const isWithinLimits = await entitlementManager.checkAll();
		if (isWithinLimits === false) return 'locked';

		return 'active';
	}

	const isWithinLimits = await entitlementManager.checkAll();
	if (isWithinLimits === false) return 'locked';

	// current time in seconds
	const now = Math.floor(Date.now() / 1000);
	const expires = license.meta.expires_at ?? license.meta.renews_at ?? -1;

	if (expires === -1 || now < expires) return 'active';
	if (expires < now && expires + license.meta.grace_period > now) return 'grace';

	throw new Error('License is expired beyond grace period');
}
