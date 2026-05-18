import { type License, type LicenseStatus } from '@directus/license';
import { EntitlementManager } from '../entitlements/manager.js';
import { isInCoreGracePeriod } from './is-in-core-grace-period.js';

export async function computeLicenseStatus(
	license: License | null,
	manager: EntitlementManager,
): Promise<LicenseStatus> {
	if (license === null) {
		const isInGrace = await isInCoreGracePeriod();

		if (isInGrace) {
			return 'grace';
		}

		const isWithinLimits = await manager.checkAll();

		if (isWithinLimits === false) {
			return 'locked';
		}

		return 'active';
	}

	const isWithinLimits = await manager.checkAll();

	if (isWithinLimits === false) {
		return 'locked';
	}

	const now = Math.floor(Date.now() / 1000);
	const expires = license.meta.expires_at ?? license.meta.renews_at ?? -1;

	if (expires === -1 || expires > now) return 'active';

	// JWT auto expires on `expires_at` + `grace_period`
	return 'grace';
}
