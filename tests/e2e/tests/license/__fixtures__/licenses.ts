export { createLicense } from '@directus/mock-license-server';
export type { MockLicense as License } from '@directus/mock-license-server';

/** Keys pre-registered in the mock license server. */
export const LICENSE_KEYS = {
	/** -1 limits, all features on. The global e2e instance boots with this key. */
	UNLIMITED: 'D0000-00000-00000-00000-0000K',
	/** 10 seats, 50 collections, 25 flows, all features on, addons available. */
	LIMITED: 'D0001-00000-00000-00000-0000J',
	/** 1/1/1 limits, all features off. For boundary enforcement testing. */
	TINY: 'D0005-00000-00000-00000-0000E',
} as const;

export type LicenseKeyName = keyof typeof LICENSE_KEYS;
