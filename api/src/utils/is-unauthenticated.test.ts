import { describe, expect, test } from 'vitest';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import { isUnauthenticated } from './is-unauthenticated.js';

const UNAUTHENTICATED_CASES = [
	{ input: createDefaultAccountability(), expected: true, name: 'default accountability (role=null, user=null)' },
	{
		input: createDefaultAccountability({ share: 'some-share-id' }),
		expected: true,
		name: 'share is set but role and user are null',
	},
];

const AUTHENTICATED_CASES = [
	{ input: createDefaultAccountability({ user: 'some-user-id' }), expected: false, name: 'user is set' },
	{ input: createDefaultAccountability({ role: 'some-role-id' }), expected: false, name: 'role is set' },
	{
		input: createDefaultAccountability({ role: 'some-role-id', user: 'some-user-id' }),
		expected: false,
		name: 'both role and user are set',
	},
];

const NO_ACCOUNTABILITY_CASES = [
	{ input: null, expected: false, name: 'null' },
	{ input: undefined, expected: true, name: 'undefined' },
];

describe('isUnauthenticated', () => {
	test.each(UNAUTHENTICATED_CASES)('returns $expected when $name', ({ input, expected }) => {
		expect(isUnauthenticated(input)).toBe(expected);
	});

	test.each(AUTHENTICATED_CASES)('returns $expected when $name', ({ input, expected }) => {
		expect(isUnauthenticated(input)).toBe(expected);
	});

	test.each(NO_ACCOUNTABILITY_CASES)('returns $expected when accountability is $name', ({ input, expected }) => {
		expect(isUnauthenticated(input)).toBe(expected);
	});
});
