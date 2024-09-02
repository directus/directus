import { ActionPermission } from '@/types/permissions';
import { expect, it } from 'vitest';
import { isFullPermission } from './is-full-permission';

const cases: { access: ActionPermission['access']; result: boolean }[] = [
	{ access: 'none', result: false },
	{ access: 'partial', result: false },
	{ access: 'full', result: true },
];

it.each(cases)('should return $result for $access', ({ access, result }) => {
	const mockPermission = { access } as ActionPermission;

	expect(isFullPermission(mockPermission)).toBe(result);
});
