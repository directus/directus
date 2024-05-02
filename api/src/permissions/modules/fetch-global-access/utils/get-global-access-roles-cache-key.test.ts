import { expect, test } from 'vitest';
import { getGlobalAccessRolesCacheKey } from './get-global-access-roles-cache-key.js';

test('Prefixes with gar, joins on _', () => {
	expect(getGlobalAccessRolesCacheKey(['role-a', 'role-b'])).toBe('gar-role-a_role-b');
});
