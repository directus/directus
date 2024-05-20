import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { PermissionsService } from '../../../services/permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { fetchAllowedFields } from './fetch-allowed-fields.js';

vi.mock('../../lib/fetch-policies.js');

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
	PermissionsService.prototype.readByQuery = vi.fn();
});

test('Returns unique array of all fields that are associated with the permissions for the passed accountability object', async () => {
	const acc = {} as Accountability;
	const policies = ['policy-a'];

	const permissions = [
		{ fields: ['field-a'] },
		{ fields: ['field-a', 'field-b'] },
		{ fields: ['field-c'] },
	] as Permission[];

	vi.mocked(fetchPolicies).mockResolvedValue(policies);
	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const fields = await fetchAllowedFields(
		{ collection: 'collection-a', action: 'read', accountability: acc },
		{} as Context,
	);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		fields: ['fields'],
		filter: {
			_and: [{ policy: { _in: policies } }, { collection: { _eq: 'collection-a' } }, { action: { _eq: 'read' } }],
		},
		limit: -1,
	});

	expect(fields).toEqual(['field-a', 'field-b', 'field-c']);
});
