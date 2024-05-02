import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AccessService } from '../../../services/access.js';
import type { PermissionsService } from '../../../services/index.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import { fetchAllowedFields } from './fetch-allowed-fields.js';

vi.mock('../../lib/fetch-policies.js');

let accessService: AccessService;
let permissionsService: PermissionsService;

beforeEach(() => {
	vi.clearAllMocks();

	accessService = {
		readByQuery: vi.fn(),
	} as unknown as AccessService;

	permissionsService = {
		readByQuery: vi.fn(),
	} as unknown as PermissionsService;
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
	vi.mocked(permissionsService.readByQuery).mockResolvedValue(permissions);

	const fields = await fetchAllowedFields(accessService, permissionsService, acc, 'collection-a', 'read');

	expect(permissionsService.readByQuery).toHaveBeenCalledWith({
		fields: ['fields'],
		filter: {
			_and: [{ policy: { _in: policies } }, { collection: { _eq: 'collection-a' } }, { action: { _eq: 'read' } }],
		},
		limit: -1,
	});

	expect(fields).toEqual(['field-a', 'field-b', 'field-c']);
});
