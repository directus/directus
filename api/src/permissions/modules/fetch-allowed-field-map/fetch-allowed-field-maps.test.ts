import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { fetchFieldMaps } from './fetch-allowed-field-maps.js';

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js', () => ({ fetchPermissions: vi.fn() }));

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(fetchPermissions).mockResolvedValue([]);
});

test('Returns allowed field map of the whole schema if admin is true', async () => {
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

	const maps = await fetchFieldMaps({ accountability, action, fieldMapTypes: ['allowed'] }, { schema } as Context);

	expect(maps.allowed).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c'],
	});
});

test('Returns allowed field map from permissions for given accountability', async () => {
	const accountability = {
		admin: false,
		user: 'user',
	} as Accountability;

	const action = 'read';

	vi.mocked(fetchPolicies).mockResolvedValue(['policy-a', 'policy-b']);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ collection: 'collection-a', fields: ['field-a'] },
		{ collection: 'collection-a', fields: ['field-b'] },
		{ collection: 'collection-b', fields: ['field-a', 'field-c'] },
		{ collection: 'collection-b', fields: ['field-b'] },
	] as Permission[]);

	const maps = await fetchFieldMaps({ accountability, action, fieldMapTypes: ['allowed'] }, {} as Context);

	expect(maps.allowed).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c', 'field-b'],
	});
});

test('Returns inconsistent field map of the whole schema if admin is true', async () => {
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

	const maps = await fetchFieldMaps({ accountability, action, fieldMapTypes: ['inconsistent'] }, {
		schema,
	} as Context);

	expect(maps.inconsistent).toEqual({
		'collection-a': [],
		'collection-b': [],
	});
});

test('Returns inconsistent field map from permissions for given accountability', async () => {
	const accountability = {
		admin: false,
		user: 'user',
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

	const maps = await fetchFieldMaps({ accountability, action, fieldMapTypes: ['inconsistent'] }, {} as Context);

	expect(maps.inconsistent).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c'],
		'collection-c': ['field-a'],
	});
});

test('Returns cached inconsistent field map from permissions for given accountability', async () => {
	const accountability = {
		admin: false,
		user: 'user',
	} as Accountability;

	const action = 'read';

	vi.mocked(fetchPolicies).mockResolvedValue([]);

	// Permissions changed
	vi.mocked(fetchPermissions).mockResolvedValue([
		{ collection: 'collection-c', fields: [] },
		{ collection: 'collection-c', fields: ['field-a'] },
	] as Permission[]);

	const maps = await fetchFieldMaps({ accountability, action, fieldMapTypes: ['inconsistent'] }, {} as Context);

	// Cache from previous test is returned
	expect(maps.inconsistent).toEqual({
		'collection-a': ['field-a', 'field-b'],
		'collection-b': ['field-a', 'field-c'],
		'collection-c': ['field-a'],
	});
});
