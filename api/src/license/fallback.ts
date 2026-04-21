import { defaultEntitlements } from './defaults.js';
import type { LicenseDeactivationTargetEntitlements, LicenseEntitlements } from './types.js';

export function getLicenseFallbackEntitlements(): LicenseEntitlements {
	return structuredClone(defaultEntitlements);
}

export function toLicenseDeactivationTargetEntitlements(
	entitlements: LicenseEntitlements,
): LicenseDeactivationTargetEntitlements {
	return {
		collections: {
			limit: entitlements.collections.limit,
		},
		seats: {
			limit: entitlements.seats.limit,
		},
		sso_enabled: entitlements.sso_enabled,
	};
}
