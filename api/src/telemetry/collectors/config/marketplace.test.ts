import { describe, expect, test } from 'vitest';
import { collectMarketplace } from './marketplace.js';

describe('collectMarketplace', () => {
	test('defaults to sandbox trust and default registry', () => {
		expect(collectMarketplace({})).toEqual({ trust: 'sandbox', registry: 'default' });
	});

	test('returns all trust when configured', () => {
		expect(collectMarketplace({ MARKETPLACE_TRUST: 'all' })).toEqual({ trust: 'all', registry: 'default' });
	});

	test('returns custom registry when MARKETPLACE_REGISTRY is set', () => {
		expect(collectMarketplace({ MARKETPLACE_REGISTRY: 'https://custom.example.com' })).toEqual({
			trust: 'sandbox',
			registry: 'custom',
		});
	});
});
