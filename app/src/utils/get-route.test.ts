import { describe, expect, it, vi } from 'vitest';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';

describe('getCollectionRoute', () => {
	const collection = 'some_collection';
	const systemCollection = 'directus_users';

	it('Returns an empty string when collection is null', () => {
		expect(getCollectionRoute(null)).toBe('');
	});

	it('Returns the expected route for collection', () => {
		expect(getCollectionRoute(collection)).toBe(`/content/${collection}`);
	});

	it('Returns the expected route for system collection', () => {
		expect(getCollectionRoute(systemCollection)).toBe(`/${systemCollection.substring(9)}`);
	});
});

describe('getItemRoute', async () => {
	const collection = 'some_collection';
	const collectionRoute = `/content/${collection}`;

	vi.doMock('@/utils/get-route', () => {
		return {
			getCollectionRoute: () => collectionRoute,
			getItemRoute,
		};
	});

	it('Returns an empty string when collection is null', () => {
		const primaryKey = 123;

		expect(getItemRoute(null, primaryKey)).toBe('');
	});

	it('Returns the expected route when primary key is a number', () => {
		const primaryKey = 123;

		expect(getItemRoute(collection, primaryKey)).toBe(`${collectionRoute}/${primaryKey}`);
	});

	it('Returns the expected route when primary key is a string', () => {
		const primaryKey = 'abc';

		expect(getItemRoute(collection, primaryKey)).toBe(`${collectionRoute}/${primaryKey}`);
	});

	it('Returns the encoded route when primary key contains special characters', () => {
		const primaryKey = '#abc';
		const encodedPrimaryKey = '%23abc';

		expect(getItemRoute(collection, primaryKey)).toBe(`${collectionRoute}/${encodedPrimaryKey}`);
	});
});
