import { describe, expect, test } from 'vitest';
import { normalizeKey } from './normalize-key.js';

describe('normalizeKey', () => {
	test('lower-cases a uuid string', () => {
		expect(normalizeKey('E5987693-1309-4953-8751-C9A3C7C2D199')).toBe('e5987693-1309-4953-8751-c9a3c7c2d199');
	});

	test('treats mixed-case forms of the same uuid as equal', () => {
		expect(normalizeKey('e5987693-1309-4953-8751-c9a3c7c2d199')).toBe(
			normalizeKey('E5987693-1309-4953-8751-C9A3C7C2D199'),
		);
	});

	test('stringifies numeric keys', () => {
		expect(normalizeKey(42)).toBe('42');
	});
});
