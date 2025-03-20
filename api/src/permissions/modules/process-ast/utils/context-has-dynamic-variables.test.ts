import { beforeEach, expect, test } from 'vitest';
import type { DynamicVariableContext } from '../../../utils/extract-required-dynamic-variable-context.js';
import { contextHasDynamicVariables } from './context-has-dynamic-variables.js';

const context: DynamicVariableContext = {
	$CURRENT_USER: new Set(),
	$CURRENT_ROLE: new Set(),
	$CURRENT_ROLES: new Set(),
	$CURRENT_POLICIES: new Set(),
};

beforeEach(() => {
	Object.values(context).forEach((v) => v.clear());
});

test('Returns false if context is empty', () => {
	expect(contextHasDynamicVariables(context)).toBe(false);
});

test('Returns true if context contains value', () => {
	context.$CURRENT_ROLE.add('id');
	expect(contextHasDynamicVariables(context)).toBe(true);
});
