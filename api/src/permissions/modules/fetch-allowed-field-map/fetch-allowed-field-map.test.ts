import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { _fetchAllowedFieldMap as fetchAllowedFieldMap } from './fetch-allowed-field-map.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import type { Permission } from '@directus/types';

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js', () => ({ fetchPermissions: vi.fn() }));

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(fetchPermissions).mockResolvedValue([]);
});

test('Returns field map of the whole schema if admin is true', async () => {
	const accountability = {
		admin: true,
	} as Accountability;

	const action = 'read';

	const schema = {
		collections: {
			'collection-a': {
				fields: {
					'field-a': {},
					'field-b': {},
				},
			},
			'collection-b': {
				fields: {
					'field-a': {},
					'field-c': {},
				},
			},
		},
	} as unknown as SchemaOverview;

	const map = await fetchAllowedFieldMap({ accountability, action }, { schema } as Context);

	expect(map).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c'],
	});
});

test('Returns field map from permissions for given accountability', async () => {
	const accountability = {
		admin: false,
	} as Accountability;

	const action = 'read';

	vi.mocked(fetchPolicies).mockResolvedValue(['policy-a', 'policy-b']);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ collection: 'collection-a', fields: ['field-a'] },
		{ collection: 'collection-a', fields: ['field-b'] },
		{ collection: 'collection-b', fields: ['field-a', 'field-c'] },
		{ collection: 'collection-b', fields: ['field-b'] },
	] as Permission[]);

	const map = await fetchAllowedFieldMap({ accountability, action }, {} as Context);

	expect(map).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c', 'field-b'],
	});
});
