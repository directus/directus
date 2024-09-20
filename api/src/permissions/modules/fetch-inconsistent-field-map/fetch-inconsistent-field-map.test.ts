import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { fetchInconsistentFieldMap } from './fetch-inconsistent-field-map.js';

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

	const map = await fetchInconsistentFieldMap({ accountability, action }, { schema } as Context);

	expect(map).toEqual({
		'collection-a': [],
		'collection-b': [],
	});
});

test('Returns field map from permissions for given accountability', async () => {
	const accountability = {
		admin: false,
	} as Accountability;

	const action = 'read';

	vi.mocked(fetchPolicies).mockResolvedValue([]);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ collection: 'collection-a', fields: ['field-a'] },
		{ collection: 'collection-a', fields: ['field-b'] },
		{ collection: 'collection-b', fields: ['field-a', 'field-b', 'field-c'] },
		{ collection: 'collection-b', fields: ['field-b'] },
		{ collection: 'collection-c', fields: [] },
		{ collection: 'collection-c', fields: ['field-a'] },
	] as Permission[]);

	const map = await fetchInconsistentFieldMap({ accountability, action }, {} as Context);

	expect(map).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c'],
		'collection-c': ['field-a'],
	});
});
