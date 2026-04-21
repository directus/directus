import { LimitExceededError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import { getNumericEntitlementLimit, validateNumericEntitlementLimit } from './numeric-gate.js';

describe('getNumericEntitlementLimit', () => {
	test('returns hard_limit when present', () => {
		expect(
			getNumericEntitlementLimit({
				limit: 50,
				hard_limit: 10,
				is_overage_allowed: true,
			}),
		).toBe(10);
	});

	test('returns null when overage is allowed without a hard limit', () => {
		expect(
			getNumericEntitlementLimit({
				limit: 50,
				hard_limit: null,
				is_overage_allowed: true,
			}),
		).toBeNull();
	});

	test('returns null when the engine contract marks the limit as unlimited', () => {
		expect(
			getNumericEntitlementLimit({
				limit: null,
				hard_limit: null,
				is_overage_allowed: false,
			}),
		).toBeNull();
	});

	test('returns limit when no hard limit is present and overage is not allowed', () => {
		expect(
			getNumericEntitlementLimit({
				limit: 50,
				hard_limit: null,
				is_overage_allowed: false,
			}),
		).toBe(50);
	});
});

describe('validateNumericEntitlementLimit', () => {
	test('enforces hard_limit even when overage is allowed', () => {
		expect(() =>
			validateNumericEntitlementLimit({
				entitlement: {
					limit: 30,
					hard_limit: 50,
					is_overage_allowed: true,
				},
				current: 50,
				delta: 1,
				category: 'Collections',
			}),
		).toThrow(LimitExceededError);
	});

	test('does not throw when the projected total is within the limit', () => {
		expect(() =>
			validateNumericEntitlementLimit({
				entitlement: {
					limit: 50,
					hard_limit: null,
					is_overage_allowed: false,
				},
				current: 49,
				delta: 1,
				category: 'Collections',
			}),
		).not.toThrow();
	});

	test('throws when the projected total exceeds the enforced limit', () => {
		expect(() =>
			validateNumericEntitlementLimit({
				entitlement: {
					limit: 50,
					hard_limit: null,
					is_overage_allowed: false,
				},
				current: 50,
				delta: 1,
				category: 'Collections',
			}),
		).toThrow(LimitExceededError);
	});

	test('passes through optional limit metadata', () => {
		try {
			validateNumericEntitlementLimit({
				entitlement: {
					limit: 50,
					hard_limit: null,
					is_overage_allowed: false,
				},
				current: 50,
				delta: 1,
				category: 'Collections',
				limit_type: 'license',
			});
		} catch (error) {
			expect(error).toMatchObject({
				code: 'LIMIT_EXCEEDED',
				message: 'Collections limit exceeded.',
				extensions: {
					category: 'Collections',
					limit_type: 'license',
				},
			});
		}
	});

	test('does not throw when overage is allowed and no hard limit exists', () => {
		expect(() =>
			validateNumericEntitlementLimit({
				entitlement: {
					limit: 50,
					hard_limit: null,
					is_overage_allowed: true,
				},
				current: 50,
				delta: 100,
				category: 'Collections',
			}),
		).not.toThrow();
	});

	test('does not throw when the entitlement limit is explicitly unlimited', () => {
		expect(() =>
			validateNumericEntitlementLimit({
				entitlement: {
					limit: null,
					hard_limit: null,
					is_overage_allowed: false,
				},
				current: 50,
				delta: 100,
				category: 'Collections',
			}),
		).not.toThrow();
	});
});
