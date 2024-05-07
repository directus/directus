import type { Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { PermissionsService } from '../../services/permissions/index.js';
import { fetchPermissions as _fetchPermissions } from './fetch-permissions.js';

let permissionsService: PermissionsService;

beforeEach(() => {
	permissionsService = {
		readByQuery: vi.fn(),
	} as unknown as PermissionsService;
});

test('Returns permissions read through service', async () => {
	const permissions: Permission[] = [];
	const policies = [] as string[];
	const collections = [] as string[];

	vi.mocked(permissionsService.readByQuery).mockResolvedValue(permissions);

	const res = await _fetchPermissions({ action: 'read', policies, collections }, { permissionsService });

	expect(res).toBe(permissions);

	expect(permissionsService.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }, { collection: { _in: collections } }],
		},
		limit: -1,
	});
});

test('Fetches for all collections when collections filter is undefined', async () => {
	const permissions: Permission[] = [];
	const policies = [] as string[];

	vi.mocked(permissionsService.readByQuery).mockResolvedValue(permissions);

	const res = await _fetchPermissions({ action: 'read', policies }, { permissionsService });

	expect(res).toBe(permissions);

	expect(permissionsService.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }],
		},
		limit: -1,
	});
});
