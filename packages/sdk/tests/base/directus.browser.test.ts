import { Directus } from '../../src/directus';
import { LocalStorage, MemoryStorage } from '../../src/storage';
import { describe, expect, it } from 'vitest';

describe('browser sdk', function () {
	it('has storage', function () {
		const sdk = new Directus('http://example.com');
		expect(sdk.storage).toBeInstanceOf(LocalStorage);
	});

	it('has memory storage', function () {
		const sdk = new Directus('http://example.com', { storage: { mode: 'MemoryStorage' } });
		expect(sdk.storage).toBeInstanceOf(MemoryStorage);
	});
});
