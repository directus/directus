import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { PermissionsService } from '../../services/permissions.js';
import type { Context } from '../types.js';
import { fetchDynamicVariableData } from '../utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../utils/process-permissions.js';
import { fetchPermissions } from './fetch-permissions.js';
import { withAppMinimalPermissions } from './with-app-minimal-permissions.js';

vi.mock('../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('./with-app-minimal-permissions.js');
vi.mock('../utils/fetch-dynamic-variable-data.js');
vi.mock('../utils/process-permissions.js');

beforeEach(() => {
	PermissionsService.prototype.readByQuery = vi.fn();

	vi.mocked(fetchDynamicVariableData).mockResolvedValue({});

	vi.mocked(withAppMinimalPermissions).mockImplementation((_, permissions) => permissions);
	vi.mocked(processPermissions).mockImplementation(({ permissions }) => permissions);
});

test('Returns permissions read through service sorted by the order of policies', async () => {
	const permissions: Permission[] = [
		{ policy: 'policy-2' },
		{ policy: 'policy-1' },
		{ policy: 'policy-1' },
	] as Permission[];

	const policies = ['policy-1', 'policy-2'] as string[];
	const collections = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ action: 'read', policies, collections }, {} as Context);

	expect(res).toStrictEqual([{ policy: 'policy-1' }, { policy: 'policy-1' }, { policy: 'policy-2' }]);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }, { collection: { _in: collections } }],
		},
		limit: -1,
	});
});

test('Returns all action permissions if action is undefined', async () => {
	const permissions: Permission[] = [{ policy: 'policy-1' }] as Permission[];
	const policies = [] as string[];
	const collections = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ policies, collections }, {} as Context);

	expect(res).toStrictEqual(permissions);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { collection: { _in: collections } }],
		},
		limit: -1,
	});
});

test('Fetches for all collections when collections filter is undefined', async () => {
	const permissions: Permission[] = [{ policy: 'policy-1' }] as Permission[];
	const policies = [] as string[];

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ action: 'read', policies }, {} as Context);

	expect(res).toStrictEqual(permissions);

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: 'read' } }],
		},
		limit: -1,
	});
});

test('Adds minimal permissions if accountability is passed', async () => {
	const permissions: Permission[] = [{ policy: 'policy-1' }] as Permission[];
	const accountability = {} as unknown as Accountability;
	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ accountability, policies: [], action: 'read' }, {} as Context);

	expect(res).toStrictEqual(permissions);

	expect(withAppMinimalPermissions).toHaveBeenCalledWith(accountability, permissions, {
		_and: [{ action: { _eq: 'read' } }],
	});
});

test('Injects dynamic variables by calling process permissions', async () => {
	const permissions: Permission[] = [{ policy: 'policy-1' }] as Permission[];
	const accountability = {} as unknown as Accountability;
	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue(permissions);

	const res = await fetchPermissions({ accountability, policies: ['policy-1'], action: 'read' }, {} as Context);

	expect(res).toStrictEqual(permissions);

	expect(fetchDynamicVariableData).toHaveBeenCalledWith(
		{
			accountability,
			policies: ['policy-1'],
			dynamicVariableContext: {
				$CURRENT_POLICIES: new Set(),
				$CURRENT_ROLE: new Set(),
				$CURRENT_ROLES: new Set(),
				$CURRENT_USER: new Set(),
			},
		},
		{},
	);

	expect(processPermissions).toHaveBeenCalledWith({
		permissions,
		accountability,
		permissionsContext: {},
	});
});
