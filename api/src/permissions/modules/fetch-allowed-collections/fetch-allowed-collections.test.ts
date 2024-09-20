import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { PermissionsService } from '../../../services/permissions.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { fetchAllowedCollections } from './fetch-allowed-collections.js';

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js');

beforeEach(() => {
	vi.clearAllMocks();
	PermissionsService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
	vi.mocked(fetchPermissions).mockResolvedValue([]);
});

test('Returns all schema keys if user is admin', async () => {
	const action = 'read';

	const accountability = {
		admin: true,
	} as Accountability;

	const schema = {
		collections: {
			'collection-a': {},
			'collection-b': {},
		},
	} as unknown as SchemaOverview;

	const collections = await fetchAllowedCollections({ action, accountability }, { schema } as Context);

	expect(collections).toEqual(['collection-a', 'collection-b']);
});

test('Returns unique collection names for all permissions in given action', async () => {
	vi.mocked(fetchPolicies).mockResolvedValue(['policy-a', 'policy-b']);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ collection: 'collection-a' },
		{ collection: 'collection-a' },
		{ collection: 'collection-b' },
		{ collection: 'collection-c' },
	] as Permission[]);

	const action = 'read';

	const accountability = {
		admin: false,
	} as Accountability;

	const schema = {
		collections: {
			'collection-a': {},
			'collection-b': {},
		},
	} as unknown as SchemaOverview;

	const collections = await fetchAllowedCollections({ action, accountability }, { schema } as Context);

	expect(collections).toEqual(['collection-a', 'collection-b', 'collection-c']);
});
