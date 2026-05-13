import type { LicenseStatus } from '@directus/license';
import { getEntitlementManager } from '../entitlements/manager.js';
import { getLicenseManager } from '../manager.js';
import { getCoreGracePeriod } from './get-core-grace-period.js';

export async function getStatus(options?: { isCore?: boolean }): Promise<LicenseStatus> {
	const license = await getLicenseManager().getLicense();
	const entitlementManager = getEntitlementManager();

	if (options?.isCore) {
		const isInGrace = await getCoreGracePeriod();

		if (isInGrace) {
			return 'grace';
		}

		const isInViolation = await entitlementManager.checkAll();

		if (isInViolation === false) {
			return 'locked';
		}

		return 'active';
	}

	const isInViolation = await entitlementManager.checkAll();

	if (isInViolation === false) {
		return 'locked';
	}

	// current time in seconds
	const now = Math.floor(Date.now() / 1000);

	const expires = license.meta.expires_at ?? license.meta.renews_at ?? 0;

	if (expires === -1 || expires > now) return 'active';

	if (expires + license.meta.grace_period > now) return 'grace';

	return 'expired';
}
