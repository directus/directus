import { describe, expect, it } from 'vitest';
import { getCollectionRoute, getItemRoute, getSystemCollectionRoute } from '@/utils/get-route';

describe('getSystemCollectionRoute', () => {
	it('Returns an empty string when collection is not a system collection', () => {
		const collection = 'some_collection';

		expect(getSystemCollectionRoute(collection)).toBe('');
	});

	it('Returns an empty string when collection is not an accessible system collection', () => {
		const collection = 'directus_fields';

		expect(getSystemCollectionRoute(collection)).toBe('');
	});

	it('Returns the expected route for an accessible system collection', () => {
		const collection = 'directus_users';

		expect(getSystemCollectionRoute(collection)).toBe('/users');
	});
});

describe('getCollectionRoute', () => {
	it('Returns an empty string when collection is null', () => {
		expect(getCollectionRoute(null)).toBe('');
	});

	it('Returns the expected route for collection', () => {
		const collection = 'some_collection';

		expect(getCollectionRoute(collection)).toBe(`/content/${collection}`);
	});

	it('Returns the expected route for system collection', () => {
		const systemCollection = 'directus_users';

		expect(getCollectionRoute(systemCollection)).toBe(`/users`);
	});
});

describe('getItemRoute', async () => {
	const collection = 'some_collection';
	const collectionRoute = `/content/${collection}`;

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

	it('Returns the unencoded route when primary key is "+"', () => {
		const primaryKey = '+';

		expect(getItemRoute(collection, primaryKey)).toBe(`${collectionRoute}/${primaryKey}`);
	});

	it('Returns the route with ignored primary key for singleton system collection', () => {
		const collection = 'directus_settings';
		const primaryKey = 123;

		expect(getItemRoute(collection, primaryKey)).toBe('/settings/project');
	});

	it('Returns the route with version query param when versionKey is provided', () => {
		const primaryKey = 123;
		const versionKey = 'v1';

		expect(getItemRoute(collection, primaryKey)).toBe(`${collectionRoute}/${primaryKey}`);

		expect(getItemRoute(collection, primaryKey, versionKey)).toBe(
			`${collectionRoute}/${primaryKey}?version=${versionKey}`,
		);
	});

	it('Returns the route without version query param when versionKey is null or undefined', () => {
		const primaryKey = 123;

		expect(getItemRoute(collection, primaryKey, null)).toBe(`${collectionRoute}/${primaryKey}`);
		expect(getItemRoute(collection, primaryKey, undefined)).toBe(`${collectionRoute}/${primaryKey}`);
	});

	it('Returns route with version and versionId when primaryKey is "+" and both are provided', () => {
		const primaryKey = '+';
		const versionKey = 'draft';
		const versionId = 'abc-123';

		expect(getItemRoute(collection, primaryKey, versionKey, versionId)).toBe(
		  `${collectionRoute}/+?version=${versionKey}&versionId=${versionId}`,
		);
	  });

	  it('Returns route with only version when primaryKey is "+" and versionId is omitted', () => {
		const primaryKey = '+';
		const versionKey = 'draft';

		expect(getItemRoute(collection, primaryKey, versionKey)).toBe(
		  `${collectionRoute}/+?version=${versionKey}`,
		);
	  });

	  it('Returns route with only version (no versionId) when primaryKey is not "+" even if versionId is provided', () => {
		const primaryKey = 123;
		const versionKey = 'draft';
		const versionId = 'abc-123';

		expect(getItemRoute(collection, primaryKey, versionKey, versionId)).toBe(
		  `${collectionRoute}/${primaryKey}?version=${versionKey}`,
		);
	  });

	  it('Returns base route when only versionId is provided without versionKey', () => {
		const primaryKey = 123;
		const versionId = 'abc-123';

		expect(getItemRoute(collection, primaryKey, undefined, versionId)).toBe(
		  `${collectionRoute}/${primaryKey}`,
		);
	  });

	  it('Returns base route when primaryKey is "+" but only versionId is provided without versionKey', () => {
		const primaryKey = '+';
		const versionId = 'abc-123';

		expect(getItemRoute(collection, primaryKey, undefined, versionId)).toBe(
		  `${collectionRoute}/+`,
		);
	  });
});
