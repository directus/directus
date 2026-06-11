/**
 * license fixtures for the e2e suite.
 *
 */

export { createLicense } from '@directus/mock-license-server';
export type { MockLicense as License } from '@directus/mock-license-server';

export const LICENSE_KEYS = {
	/** -1 limits, all features on. The global e2e instance boots with this key. */
	UNLIMITED: 'D0000-00000-00000-00000-0000K',
	/** 10 seats, 50 collections, 25 flows, all features on, addons available. */
	LIMITED: 'D0001-00000-00000-00000-0000J',
	/** LIMITED shape, expired 2d ago, still within grace period. */
	LIMITED_GRACE: 'D0002-00000-00000-00000-0000H',
	/** LIMITED shape, past grace period — should force downgrade on refresh. */
	LIMITED_EXPIRED: 'D0003-00000-00000-00000-0000G',
	/** 1/1/1 limits, all features off. For boundary enforcement testing. */
	TINY: 'D0005-00000-00000-00000-0000E',
} as const;

export type LicenseKeyName = keyof typeof LICENSE_KEYS;
