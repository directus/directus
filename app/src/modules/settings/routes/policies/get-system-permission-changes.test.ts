import { expect, test } from 'vitest';
import {
	getAccessSystemPermissionChanges,
	getAttachedExistingPolicies,
	getSystemPermissionChanges,
} from './get-system-permission-changes';

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

test('returns the system collection permission changes of policies edited through access rows', () => {
	const result = getAccessSystemPermissionChanges({
		create: [
			{
				policy: {
					name: 'New',
					permissions: { create: [{ collection: 'directus_files', action: 'read' }], update: [], delete: [] },
				},
			},
			{ policy: 'existing-policy' },
		],
		update: [
			{
				policy: {
					id: 'policy-1',
					permissions: { create: [{ collection: 'directus_users', action: 'create' }], update: [], delete: [] },
				},
			},
		],
		delete: [],
	});

	expect(result).toEqual([
		{ collection: 'directus_files', action: 'read', unfilteredRead: true },
		{ collection: 'directus_users', action: 'create', unfilteredRead: false },
	]);
});

test('returns the existing policies attached through access rows and their edited permissions', () => {
	const result = getAttachedExistingPolicies({
		create: [
			{ policy: { id: 'policy-1' } },
			{
				policy: {
					id: 'policy-2',
					permissions: { create: [], update: [{ id: 3, permissions: { folder: { _eq: 'public' } } }], delete: [4] },
				},
			},
			{ policy: { name: 'New' } },
		],
		update: [{ policy: { id: 'policy-3' } }],
		delete: [],
	});

	expect(result).toEqual({ policyIds: ['policy-1', 'policy-2'], editedPermissionIds: [3, 4] });
});
