import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { PermissionsService } from '../../../services/permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { _fetchAllowedFieldMap as fetchAllowedFieldMap } from './fetch-allowed-field-map.js';

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../lib/fetch-policies.js');

beforeEach(() => {
	vi.clearAllMocks();

	PermissionsService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
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

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue([
		{ collection: 'collection-a', fields: ['field-a'] },
		{ collection: 'collection-a', fields: ['field-b'] },
		{ collection: 'collection-b', fields: ['field-a', 'field-c'] },
		{ collection: 'collection-b', fields: ['field-b'] },
	]);

	const map = await fetchAllowedFieldMap({ accountability, action }, {} as Context);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		fields: ['collection', 'fields'],
		filter: { _and: [{ policy: { _in: ['policy-a', 'policy-b'] } }, { action: { _eq: 'read' } }] },
		limit: -1,
	});

	expect(map).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c', 'field-b'],
	});
});
