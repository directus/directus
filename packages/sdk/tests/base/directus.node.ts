// @vitest-environment node
import { MemoryStorage } from '../../src/storage';
import { Directus } from '../../src/directus';
import { describe, expect, it } from 'vitest';

describe('node sdk', function () {
	const sdk = new Directus('http://example.com');

	it('has storage', function () {
		expect(sdk.storage).toBeInstanceOf(MemoryStorage);
	});
});
