import { Filter, Permission } from '@directus/types';
import { expect, it } from 'vitest';
import { isFullPermission } from './is-full-permission';

it('should return true if permission contains no permissions rule (null)', () => {
	const mockPermission = {
		permissions: null,
	} as Permission;

	const result = isFullPermission(mockPermission);

	expect(result).toBe(true);
});

it('should return true if permission contains no permissions rule ({})', () => {
	const mockPermission = {
		permissions: {},
	} as Permission;

	const result = isFullPermission(mockPermission);

	expect(result).toBe(true);
});

it('should return false if permission contains permissions rule', () => {
	const mockPermission = {
		permissions: { _and: [{ example: { _eq: 'example' } }] } as Filter,
	} as Permission;

	const result = isFullPermission(mockPermission);

	expect(result).toBe(false);
});
