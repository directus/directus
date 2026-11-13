import { describe, expect, it } from 'vitest';
import { isSystemCollection } from './collections/index.js';
import { HARDCODED_AUTH_REQUIREMENTS } from './hardcoded-auth-requirements.js';
import type { PermissionsAction } from './types.js';

describe('HARDCODED_AUTH_REQUIREMENTS', () => {
	it('has no duplicate collection+action entries', () => {
		const keys = HARDCODED_AUTH_REQUIREMENTS.map((requirement) => `${requirement.collection}:${requirement.action}`);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('every row targets a system collection', () => {
		for (const { collection } of HARDCODED_AUTH_REQUIREMENTS) {
			expect(isSystemCollection(collection)).toBe(true);
		}
	});

	it('every row has a valid action and auth level', () => {
		// The typed binding is the check - the const itself can't carry a `satisfies` clause under
		// isolatedDeclarations (TS9010). A stray `action` or `requiredAuth` fails typecheck here.
		const rows: readonly { collection: string; action: PermissionsAction; requiredAuth: 'admin' | 'user' }[] =
			HARDCODED_AUTH_REQUIREMENTS;

		expect(rows).toBe(HARDCODED_AUTH_REQUIREMENTS);
	});
});
