import { describe, expect, test } from 'vitest';
import { getRoutePrimaryKey } from './get-route-primary-key';

describe('getRoutePrimaryKey', () => {
	test('returns item primary keys', () => {
		expect(getRoutePrimaryKey('123')).toBe('123');
	});

	test('ignores the create-item route marker', () => {
		expect(getRoutePrimaryKey('+')).toBeUndefined();
	});

	test('ignores missing or non-string route params', () => {
		expect(getRoutePrimaryKey(undefined)).toBeUndefined();
		expect(getRoutePrimaryKey(['123'])).toBeUndefined();
	});
});
