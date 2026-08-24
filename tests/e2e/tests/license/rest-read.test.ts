import { readLicense } from '@directus/license';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { describe, expect, test } from 'vitest';
import { createLicense, LICENSE_KEYS } from './__fixtures__/licenses.js';

const adminApi = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const api = createDirectus(`http://localhost:${port}`).with(rest());

describe('GET /licenses (admin)', () => {
	test('unauthenticated user rejected', async () => {
		await expect(api.request(readLicense())).rejects.toThrow();
	});

	test('reads the global UNLIMITED license matching the registered fixture', async () => {
		const license = (await adminApi.request(readLicense())) as any;

		// Rebuild the registered fixture from its key; the API response must match it.
		const expected = createLicense({
			key: LICENSE_KEYS.UNLIMITED,
			name: 'UNLIMITED',
			meta: { name: 'UNLIMITED' },
		});

		expect(license).toMatchObject({
			source: 'env',
			name: 'UNLIMITED',
			status: 'active',
			entitlements: expected.entitlements,
		});

		expect(license.usage).toHaveProperty('seats');
		expect(license.usage).toHaveProperty('collections');
		expect(license.usage).toHaveProperty('flows');
	});
});
