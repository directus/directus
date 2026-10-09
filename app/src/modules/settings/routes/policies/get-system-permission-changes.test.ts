import { expect, test } from 'vitest';
import { getSystemPermissionChanges } from './get-system-permission-changes';

test('returns an empty list when there are no alterations', () => {
	expect(getSystemPermissionChanges(undefined)).toEqual([]);
	expect(getSystemPermissionChanges([1, 2])).toEqual([]);
});

test('returns created and updated system collection permissions, ignoring deletions and user collections', () => {
	const result = getSystemPermissionChanges({
		create: [
			{ collection: 'directus_files', action: 'read', permissions: null },
			{ collection: 'articles', action: 'read', permissions: null },
		],
		update: [{ id: 1, collection: 'directus_users', action: 'update', permissions: null }],
		delete: [2],
	});

	expect(result).toEqual([
		{ collection: 'directus_files', action: 'read', unfilteredRead: true },
		{ collection: 'directus_users', action: 'update', unfilteredRead: false },
	]);
});

test('does not flag a read with a filter as unfiltered', () => {
	const result = getSystemPermissionChanges({
		create: [{ collection: 'directus_files', action: 'read', permissions: { folder: { _eq: 'public' } } }],
		update: [],
		delete: [],
	});

	expect(result[0]?.unfilteredRead).toBe(false);
});
