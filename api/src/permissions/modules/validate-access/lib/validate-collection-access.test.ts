import { validateCollectionAccess } from './validate-collection-access.js';
import { fetchPermissions } from '../../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../../lib/fetch-policies.js';
import type { Context } from '../../../types.js';
import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../../lib/fetch-permissions.js');
vi.mock('../../../lib/fetch-policies.js');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(fetchPolicies).mockResolvedValue([]);
});

test('Returns false if permissions is an empty array', async () => {
	vi.mocked(fetchPermissions).mockResolvedValue([]);

	const accountability = {} as unknown as Accountability;

	const res = await validateCollectionAccess(
		{ accountability, action: 'read', collection: 'collection-a' },
		{} as unknown as Context,
	);

	expect(res).toBe(false);

	expect(fetchPolicies).toHaveBeenCalledWith(accountability, {});

	expect(fetchPermissions).toHaveBeenCalledWith(
		{
			accountability,
			action: 'read',
			policies: [],
			collections: ['collection-a'],
		},
		{},
	);
});

test('Returns true if permissions exist', async () => {
	vi.mocked(fetchPermissions).mockResolvedValue([{} as unknown as Permission]);

	const accountability = {} as unknown as Accountability;

	const res = await validateCollectionAccess(
		{ accountability, action: 'read', collection: 'collection-a' },
		{} as unknown as Context,
	);

	expect(res).toBe(true);

	expect(fetchPolicies).toHaveBeenCalledWith(accountability, {});

	expect(fetchPermissions).toHaveBeenCalledWith(
		{
			accountability,
			action: 'read',
			policies: [],
			collections: ['collection-a'],
		},
		{},
	);
});
