import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { PermissionsService } from '../../services/permissions.js';
import type { Context } from '../types.js';
import { processPermissions } from '../utils/process-permissions.js';
import { _fetchPermissions as fetchPermissions } from './fetch-permissions.js';
import { withAppMinimalPermissions } from '../../services/permissions/lib/with-app-minimal-permissions.js';
import { fetchDynamicVariableContext } from '../utils/fetch-dynamic-variable-context.js';

vi.mock('../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../services/permissions/lib/with-app-minimal-permissions.js');
vi.mock('../utils/fetch-dynamic-variable-context.js');
vi.mock('../utils/process-permissions.js');

beforeEach(() => {
	PermissionsService.prototype.readByQuery = vi.fn();

	vi.mocked(withAppMinimalPermissions).mockReturnValue([]);
	vi.mocked(fetchDynamicVariableContext).mockResolvedValue({});

	vi.mocked(processPermissions).mockReturnValue([]);
});

test('Returns permissions read through service', async () => {
	const permissions: Permission[] = [];
	const policies = [] as string[];
	const collections = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ action: 'read', policies, collections }, {} as Context);

	expect(res).toBe(permissions);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }, { collection: { _in: collections } }],
		},
		limit: -1,
	});
});

test('Returns all action permissions if action is undefined', async () => {
	const permissions: Permission[] = [];
	const policies = [] as string[];
	const collections = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ policies, collections }, {} as Context);

	expect(res).toBe(permissions);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { collection: { _in: collections } }],
		},
		limit: -1,
	});
});

test('Fetches for all collections when collections filter is undefined', async () => {
	const permissions: Permission[] = [];
	const policies = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ action: 'read', policies }, {} as Context);

	expect(res).toBe(permissions);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }],
		},
		limit: -1,
	});
});

test('Adds minimal permissions if accountability is passed', async () => {
	const permissions: Permission[] = [];
	const accountability = {} as unknown as Accountability;
	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue([]);
	vi.mocked(withAppMinimalPermissions).mockReturnValue(permissions);
	vi.mocked(processPermissions).mockImplementation(({ permissions }) => permissions);

	const res = await fetchPermissions({ accountability, policies: [], action: 'read' }, {} as Context);

	expect(res).toBe(permissions);
	expect(withAppMinimalPermissions).toHaveBeenCalledWith(accountability, [], { _and: [{ action: { _eq: 'read' } }] });
});

test('Injects dynamic variables by calling process permissions', async () => {
	const permissions: Permission[] = [];
	const accountability = {} as unknown as Accountability;
	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue([]);
	vi.mocked(withAppMinimalPermissions).mockReturnValue([]);
	vi.mocked(processPermissions).mockReturnValue(permissions);

	const res = await fetchPermissions({ accountability, policies: ['policy-1'], action: 'read' }, {} as Context);

	expect(res).toBe(permissions);

	expect(fetchDynamicVariableContext).toHaveBeenCalledWith(
		{
			accountability,
			policies: ['policy-1'],
			permissions,
		},
		{},
	);

	expect(processPermissions).toHaveBeenCalledWith({
		permissions: [],
		accountability,
		permissionsContext: {},
	});
});
