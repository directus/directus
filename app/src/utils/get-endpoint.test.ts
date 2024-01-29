import { describe, expect, it, vi } from 'vitest';
import { getEndpoint } from './get-endpoint.js';

vi.mock('./is-system-collection', () => {
	const isSystemCollection = (collection: string) => {
		if (collection === 'directus_users') return true;
		return false;
	};

	return { isSystemCollection };
});

describe('getEndpoint', () => {
	it('When a system collection is passed in', () => {
		expect(getEndpoint('directus_users')).toBe('/users');
	});

	it('When a non-system collection is passed in', () => {
		expect(getEndpoint('user_collection')).toBe('/items/user_collection');
	});
});
