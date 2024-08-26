import type { Permission } from '@directus/types';
import { test, expect } from 'vitest';
import { extractRequiredDynamicVariableContext } from './extract-required-dynamic-variable-context.js';

test('Extracts dynamic variables context from permissions', () => {
	const permissions = [
		{
			permissions: {
				_or: [{ id: { _eq: '$CURRENT_USER.id' } }, { id: { _in: '$CURRENT_ROLES.id' } }],
			},
		},
		{
			permissions: {
				id: { _eq: '$CURRENT_POLICIES.foo' },
			},
		},
		{
			validation: {
				id: { _eq: '$CURRENT_ROLE.name' },
			},
		},
		{
			presets: {
				id: '$CURRENT_ROLES.description',
			},
		},
	] as unknown as Permission[];

	const res = extractRequiredDynamicVariableContext(permissions);

	expect(res).toEqual({
		$CURRENT_USER: new Set(['id']),
		$CURRENT_ROLE: new Set(['name']),
		$CURRENT_ROLES: new Set(['description', 'id']),
		$CURRENT_POLICIES: new Set(['foo']),
	});
});
