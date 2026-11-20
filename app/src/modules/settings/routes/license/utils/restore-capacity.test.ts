import type { LicenseResolvedOutput } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { canSubmitRestore, countNotRestored, effectiveUsage, isAtCapacity } from './restore-capacity';

const AT = '2026-11-20T00:00:00.000Z';
const user = (id: string) => ({ id, first_name: null, last_name: null, avatar: null, email: null, resolved_at: AT });
const none = { collections: 0, flows: 0, seats: 0, sso_users: 0 };

const output: LicenseResolvedOutput = {
	collections: { limit: 25, usage: 23, candidates: [{ id: 'c1', resolved_at: AT }] },
	seats: { limit: 3, usage: 2, candidates: [user('u1')] },
	sso_users: { entitled: true, limit: 3, usage: 2, candidates: [user('s1')] },
};

describe('effectiveUsage', () => {
	test('adds on restore and subtracts on deactivate', () => {
		expect(effectiveUsage('restore', 3, 2)).toBe(5);
		expect(effectiveUsage('deactivate', 3, 2)).toBe(1);
	});
});

describe('isAtCapacity', () => {
	test('unlimited is never at capacity', () => {
		expect(isAtCapacity(-1, 1000, 1000)).toBe(false);
	});

	test('is at capacity once usage plus selection reaches the limit', () => {
		expect(isAtCapacity(5, 4, 0)).toBe(false);
		expect(isAtCapacity(5, 4, 1)).toBe(true);
	});
});

describe('canSubmitRestore', () => {
	test('is false with no selection', () => {
		expect(canSubmitRestore(output, none)).toBe(false);
	});

	test('is false when seats + sso_users selected exceed the seat limit', () => {
		expect(canSubmitRestore(output, { ...none, seats: 1, sso_users: 1 })).toBe(false);
	});

	test('is false when sso_users are selected but not entitled', () => {
		const notEntitled = { ...output, sso_users: { entitled: false, limit: 3, usage: 2, candidates: [user('s1')] } };

		expect(canSubmitRestore(notEntitled, { ...none, sso_users: 1 })).toBe(false);
	});

	test('counts sso users against seats when no seat section exists', () => {
		const ssoOnly = { sso_users: { entitled: true, limit: 3, usage: 3, candidates: [user('s1')] } };

		expect(canSubmitRestore(ssoOnly, { ...none, sso_users: 1 })).toBe(false);
	});

	test('is true within every limit', () => {
		expect(canSubmitRestore(output, { ...none, collections: 1, seats: 1 })).toBe(true);
	});

	test('is true for an unlimited section', () => {
		const unlimited = { flows: { limit: -1, usage: 0, candidates: [{ id: 'f1', name: 'a', resolved_at: AT }] } };

		expect(canSubmitRestore(unlimited, { ...none, flows: 1 })).toBe(true);
	});
});

describe('countNotRestored', () => {
	test('counts selected ids missing from the restored result', () => {
		expect(countNotRestored({ flows: ['f1', 'f2'], seats: ['u1'] }, { flows: ['f1'], seats: ['u1'] })).toBe(1);
	});

	test('treats a missing result as nothing restored', () => {
		expect(countNotRestored({ flows: ['f1'] }, undefined)).toBe(1);
	});
});
