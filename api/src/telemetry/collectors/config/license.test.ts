import { describe, expect, test } from 'vitest';
import { collectLicenseConfig } from './license.js';

describe('collectLicenseConfig', () => {
	test('defaults to false', () => {
		expect(collectLicenseConfig({})).toStrictEqual({ key_management: false });
	});

	test('reads LICENSE_KEY_MANAGEMENT_ENABLED', () => {
		expect(collectLicenseConfig({ LICENSE_KEY_MANAGEMENT_ENABLED: true })).toStrictEqual({ key_management: true });
	});
});
