import type { DynamicVariableContext } from './extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from './fetch-dynamic-variable-data.js';
import { PoliciesService } from '../../services/policies.js';
import { RolesService } from '../../services/roles.js';
import { UsersService } from '../../services/users.js';
import type { Context } from '../types.js';
import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';

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

	const dynamicVariableContext: DynamicVariableContext = {
		$CURRENT_USER: new Set(['email']),
		$CURRENT_ROLE: new Set(),
		$CURRENT_ROLES: new Set(),
		$CURRENT_POLICIES: new Set(),
	};

	vi.mocked(UsersService.prototype.readOne).mockResolvedValue(user);

	const res = await fetchDynamicVariableData(
		{
			accountability: { user: 'user', roles: [] as string[] } as Accountability,
			policies: [],
			dynamicVariableContext,
		},
		{} as Context,
	);

	expect(res['$CURRENT_USER']).toBe(user);
	expect(UsersService.prototype.readOne).toHaveBeenCalledWith('user', { fields: ['email'] });
});

test('Returns filter context for current role', async () => {
	const role = {};

	const dynamicVariableContext: DynamicVariableContext = {
		$CURRENT_USER: new Set(),
		$CURRENT_ROLE: new Set(['name']),
		$CURRENT_ROLES: new Set(),
		$CURRENT_POLICIES: new Set(),
	};

	vi.mocked(RolesService.prototype.readOne).mockResolvedValue(role);

	const res = await fetchDynamicVariableData(
		{
			dynamicVariableContext,
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

	const dynamicVariableContext: DynamicVariableContext = {
		$CURRENT_USER: new Set(),
		$CURRENT_ROLE: new Set(),
		$CURRENT_ROLES: new Set(),
		$CURRENT_POLICIES: new Set(['name']),
	};

	vi.mocked(PoliciesService.prototype.readMany).mockResolvedValue(policies);

	const res = await fetchDynamicVariableData(
		{
			dynamicVariableContext,
			accountability: { roles: [] as string[] } as Accountability,
			policies: ['policy-1'],
		},
		{} as Context,
	);

	expect(res['$CURRENT_POLICIES']).toBe(policies);
	expect(PoliciesService.prototype.readMany).toHaveBeenCalledWith(['policy-1'], { fields: ['name', 'id'] });
});
