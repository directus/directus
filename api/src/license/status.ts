import type { License } from '@directus/license';
import type { LicenseStatus } from './types.js';

export function getStatus(license: License | null, error?: Error): LicenseStatus {
	if (!license) {
		if (error && error.message.includes('canceled')) {
			return 'canceled';
		}

		if (error && error.message.includes('suspended')) {
			return 'suspended';
		}

		// assume core license
		return 'active';
	}

	// current time in seconds
	const now = Math.floor(Date.now() / 1000);

	const expires = license.meta.expires_at ?? license.meta.renews_at ?? 0;

	if (expires === -1 || expires > now) return 'active';

	if (expires + license.meta.grace_period > now) return 'grace';

	return 'expired';
}
