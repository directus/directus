// @vitest-environment node
import { Directus, MemoryStorage } from '../../src/base';
import { describe, expect, it } from 'vitest';

describe('node sdk', function () {
	const sdk = new Directus('http://example.com');

	it('has storage', function () {
		expect(sdk.storage).toBeInstanceOf(MemoryStorage);
	});
});
