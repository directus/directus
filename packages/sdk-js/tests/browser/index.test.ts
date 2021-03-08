/**
 * @jest-environment jest-environment-jsdom-global
 */

import { Browser as Directus } from '../../src/browser';

describe('browser', function () {
	it('constructor', async function () {
		const sdk = new Directus('http://example.com');
		expect(sdk).not.toBeNull();
		expect(sdk).not.toBeUndefined();
	});
});
