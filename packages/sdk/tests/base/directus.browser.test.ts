/**
 * @jest-environment jsdom
 */

import { Directus, LocalStorage } from '@/src/index.js';

describe('browser sdk', function () {
	const sdk = new Directus('http://example.com');

	it('has storage', function () {
		expect(sdk.storage).toBeInstanceOf(LocalStorage);
	});
});
