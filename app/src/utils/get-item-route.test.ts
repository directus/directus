import { describe, expect, it } from 'vitest';

import { getItemRoute } from '@/utils/get-item-route';

const collection = 'some_collection';
const systemCollection = 'directus_users';
const primaryKeys = [123, 'abc'];

describe('getItemRoute', () => {
	it('Returns an empty string when collection is null', () => {
		for (const primaryKey of primaryKeys) {
			expect(getItemRoute(null, primaryKey)).toBe('');
		}
	});

	it('Returns the expected route for collection', () => {
		for (const primaryKey of primaryKeys) {
			expect(getItemRoute(collection, primaryKey)).toBe(`/content/${collection}/${primaryKey}`);
		}
	});

	it('Returns the expected route for system collection', () => {
		for (const primaryKey of primaryKeys) {
			expect(getItemRoute(systemCollection, primaryKey)).toBe(`/${systemCollection.substring(9)}/${primaryKey}`);
		}
	});
});
