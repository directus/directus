import type { Accountability, Permission } from '@directus/types';
import { beforeEach, test, vi, expect } from 'vitest';
import { PoliciesService } from '../../services/policies.js';
import { UsersService } from '../../services/users.js';
import { RolesService } from '../../services/roles.js';
import type { Context } from '../types.js';
import { fetchDynamicVariableContext } from './fetch-dynamic-variable-context.js';

vi.mock('../../services/users.js', () => ({
	UsersService: vi.fn(),
}));

vi.mock('../../services/roles.js', () => ({
	RolesService: vi.fn(),
}));

vi.mock('../../services/policies.js', () => ({
	PoliciesService: vi.fn(),
}));

beforeEach(() => {
	UsersService.prototype.readOne = vi.fn();
	RolesService.prototype.readOne = vi.fn();
	RolesService.prototype.readMany = vi.fn();
	PoliciesService.prototype.readMany = vi.fn();
});

test('Returns filter context for current user', async () => {
	const user = {};

	const permissions = [
		{
			permissions: {
				key: { _eq: '$CURRENT_USER.email' },
			},
		},
	] as unknown as Permission[];

	vi.mocked(UsersService.prototype.readOne).mockResolvedValue(user);

	const res = await fetchDynamicVariableContext(
		{
			permissions,
			accountability: { user: 'user', roles: [] as string[] } as Accountability,
			policies: [],
		},
		{} as Context,
	);

	expect(res['$CURRENT_USER']).toBe(user);
	expect(UsersService.prototype.readOne).toHaveBeenCalledWith('user', { fields: ['email'] });
});

test('Returns filter context for current role', async () => {
	const role = {};

	const permissions = [
		{
			permissions: {
				key: { _eq: '$CURRENT_ROLE.name' },
			},
		},
	] as unknown as Permission[];

	vi.mocked(RolesService.prototype.readOne).mockResolvedValue(role);

	const res = await fetchDynamicVariableContext(
		{
			permissions,
			accountability: { role: 'role', roles: [] as string[] } as Accountability,
			policies: [],
		},
		{} as Context,
	);

	expect(res['$CURRENT_ROLE']).toBe(role);
	expect(RolesService.prototype.readOne).toHaveBeenCalledWith('role', { fields: ['name'] });
});

test('Returns filter context for current policies', async () => {
	const policies: any[] = [];

	const permissions = [
		{
			permissions: {
				key: { _in: '$CURRENT_POLICIES.name' },
			},
		},
	] as unknown as Permission[];

	vi.mocked(PoliciesService.prototype.readMany).mockResolvedValue(policies);

	const res = await fetchDynamicVariableContext(
		{
			permissions,
			accountability: { roles: [] as string[] } as Accountability,
			policies: ['policy-1'],
		},
		{} as Context,
	);

	expect(res['$CURRENT_POLICIES']).toBe(policies);
	expect(PoliciesService.prototype.readMany).toHaveBeenCalledWith(['policy-1'], { fields: ['name'] });
});
