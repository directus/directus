import type { Permission } from '@directus/types';
import { expect, test } from 'vitest';
import {
	extractRequiredDynamicVariableContext,
	extractRequiredDynamicVariableContextForPermissions,
} from './extract-required-dynamic-variable-context.js';

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

	const res = extractRequiredDynamicVariableContextForPermissions(permissions);

	expect(res).toEqual({
		$CURRENT_USER: new Set(['id']),
		$CURRENT_ROLE: new Set(['name']),
		$CURRENT_ROLES: new Set(['description', 'id']),
		$CURRENT_POLICIES: new Set(['foo']),
	});
});

test('Extracts dynamic variables context arbitrary objects', () => {
	const result = extractRequiredDynamicVariableContext({
		some: {
			yay: '$CURRENT_USER.test.hi',
		},
		other: [
			{
				other: '$CURRENT_ROLE.name',
			},
		],
	});

	expect(result).toEqual({
		$CURRENT_USER: new Set(['test.hi']),
		$CURRENT_ROLE: new Set(['name']),
		$CURRENT_ROLES: new Set(),
		$CURRENT_POLICIES: new Set(),
	});
});

test('Does not confuse the $CURRENT_ROLE and $CURRENT_ROLES prefixes', () => {
	const result = extractRequiredDynamicVariableContext({ a: '$CURRENT_ROLES.id', b: '$CURRENT_ROLE.id' });

	expect(result.$CURRENT_ROLES).toEqual(new Set(['id']));
	expect(result.$CURRENT_ROLE).toEqual(new Set(['id']));
});

test('Walks input deeper than the call stack allows', () => {
	let val: Record<string, any> = { deep: '$CURRENT_USER.id' };

	for (let level = 0; level < 100_000; level++) {
		val = { a: val };
	}

	expect(extractRequiredDynamicVariableContext(val).$CURRENT_USER).toEqual(new Set(['id']));
});
