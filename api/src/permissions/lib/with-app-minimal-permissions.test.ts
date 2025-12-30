import { withAppMinimalPermissions } from './with-app-minimal-permissions.js';
import { filterItems } from '../../utils/filter-items.js';
import type { Accountability, Permission, Query } from '@directus/types';
import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	return {
		appAccessMinimalPermissions: [] as Permission[],
	};
});

vi.mock('@directus/system-data', () => ({ appAccessMinimalPermissions: mocks.appAccessMinimalPermissions }));
vi.mock('../../utils/filter-items.js');

it('should not modify permissions if role has no app access', () => {
	const accountability = { app: false } as Accountability;
	const permissions: Permission[] = [];
	const filter: Query['filter'] = null;

	const result = withAppMinimalPermissions(accountability, permissions, filter);

	expect(result).toBe(permissions);
});

it('should merge with filtered app minimal permissions if role has app access', () => {
	const accountability = { app: true } as Accountability;
	const permissions: Permission[] = [];
	const filter: Query['filter'] = null;
	const filteredPermissions: Permission[] = [{} as Permission];

	vi.mocked(filterItems).mockImplementation(() => filteredPermissions);

	const result = withAppMinimalPermissions(accountability, permissions, filter);

	expect(filterItems).toHaveBeenCalledWith(mocks.appAccessMinimalPermissions, filter);
	expect(result).toEqual(filteredPermissions);
});
