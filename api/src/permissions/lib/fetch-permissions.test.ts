import type { Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { PermissionsService } from '../../services/permissions.js';
import type { Context } from '../types.js';
import { fetchPermissions as _fetchPermissions } from './fetch-permissions.js';

vi.mock('../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

beforeEach(() => {
	PermissionsService.prototype.readByQuery = vi.fn();
});

test('Returns permissions read through service', async () => {
	const permissions: Permission[] = [];
	const policies = [] as string[];
	const collections = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await _fetchPermissions({ action: 'read', policies, collections }, {} as Context);

	expect(res).toBe(permissions);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }, { collection: { _in: collections } }],
		},
		limit: -1,
	});
});

test('Fetches for all collections when collections filter is undefined', async () => {
	const permissions: Permission[] = [];
	const policies = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await _fetchPermissions({ action: 'read', policies }, {} as Context);

	expect(res).toBe(permissions);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }],
		},
		limit: -1,
	});
});
