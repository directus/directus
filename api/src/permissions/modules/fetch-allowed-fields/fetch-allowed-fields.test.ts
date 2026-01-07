import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { fetchAllowedFields } from './fetch-allowed-fields.js';

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js');

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(fetchPermissions).mockResolvedValue([]);
});

test('Returns unique array of all fields that are associated with the permissions for the passed accountability object', async () => {
	const acc = {} as Accountability;
	const policies = ['policy-a'];

	const permissions = [
		{ fields: ['field-a'] },
		{ fields: ['field-a', 'field-b'] },
		{ fields: ['field-c'] },
	] as Permission[];

	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
			c.field('field-b').string();
			c.field('field-c').integer();
		})
		.build();

	vi.mocked(fetchPolicies).mockResolvedValue(policies);
	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const fields = await fetchAllowedFields({ collection: 'collection-a', action: 'read', accountability: acc }, {
		schema,
	} as Context);

	expect(fields).toEqual(['field-a', 'field-b', 'field-c']);
});

test('Removes fields that are not in the schema', async () => {
	const acc = {} as Accountability;
	const policies = ['policy-a'];

	const permissions = [
		{ fields: ['field-a'] },
		{ fields: ['field-a', 'field-b'] },
		{ fields: ['field-c'] },
		{ fields: ['*'] },
	] as Permission[];

	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	vi.mocked(fetchPolicies).mockResolvedValue(policies);
	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const fields = await fetchAllowedFields({ collection: 'collection-a', action: 'read', accountability: acc }, {
		schema,
	} as Context);

	expect(fields).toEqual(['field-a', '*']);
});
