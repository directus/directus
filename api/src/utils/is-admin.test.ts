import { describe, expect, test } from 'vitest';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import { isAdmin } from './is-admin.js';

const ADMIN_CASES = [
	{ label: 'null accountability (system call)', input: null },
	{ label: 'admin user', input: createDefaultAccountability({ admin: true }) },
];

const FALLBACK_CASES = [
	{ label: 'undefined accountability', input: undefined },
	{ label: 'non-admin user', input: createDefaultAccountability() },
	{ label: 'app user without admin', input: createDefaultAccountability({ app: true }) },
	{
		label: 'user without role(s)',
		input: createDefaultAccountability({ user: '123', role: '123', roles: ['123'] }),
	},
];

describe('isAdmin', () => {
	test.each(ADMIN_CASES)('returns true for $label', ({ input }) => {
		expect(isAdmin(input)).toBe(true);
	});

	test.each(FALLBACK_CASES)('returns false for $label', ({ input }) => {
		expect(isAdmin(input)).toBe(false);
	});
});
