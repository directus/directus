import { expect, test, vi } from 'vitest';
import type { RolesService } from '../../services/roles.js';
import { fetchRolesTree } from './fetch-roles-tree.js';

test('Returns parent tree in reversed order', async () => {
	const mockService = {
		readOne: vi
			.fn()
			.mockResolvedValueOnce({ id: 'role-1', parent: 'role-2' })
			.mockResolvedValueOnce({ id: 'role-2', parent: 'role-3' })
			.mockResolvedValueOnce({ id: 'role-3', parent: null }),
	} as unknown as RolesService;

	const roles = await fetchRolesTree(mockService, 'role-1');

	expect(mockService.readOne).toHaveBeenCalledTimes(3);
	expect(mockService.readOne).toHaveBeenCalledWith('role-1', { fields: ['id', 'parent'] });
	expect(roles).toEqual(['role-3', 'role-2', 'role-1']);
});

test('Returns empty array if passed role is null', async () => {
	expect(await fetchRolesTree({} as unknown as RolesService, null)).toEqual([]);
});
