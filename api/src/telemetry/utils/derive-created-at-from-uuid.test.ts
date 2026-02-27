import { describe, expect, test } from 'vitest';
import { deriveCreatedAtFromUuid } from './derive-created-at-from-uuid.js';

describe('deriveCreatedAtFromUuid', () => {
	test('extracts timestamp from a valid UUID v7', () => {
		// UUID v7: first 48 bits (12 hex chars) encode Unix ms timestamp
		// 0x018cc701e800 = 1704145840128 ms = 2024-01-01T21:50:40.128Z
		const uuid = '018cc701-e800-7000-8000-000000000000';
		const result = deriveCreatedAtFromUuid(uuid);
		expect(result).toBe('2024-01-01T21:50:40.128Z');
	});

	test('returns null for uuid with invalid length', () => {
		expect(deriveCreatedAtFromUuid('short')).toBeNull();
		expect(deriveCreatedAtFromUuid('')).toBeNull();
	});

	test('returns an ISO string for any valid-length uuid', () => {
		const uuid = '00000000-0000-0000-0000-000000000000';
		const result = deriveCreatedAtFromUuid(uuid);
		expect(result).toBe('1970-01-01T00:00:00.000Z');
	});

	test('handles uppercase uuid', () => {
		const uuid = '018CC701-E800-7000-8000-000000000000';
		const result = deriveCreatedAtFromUuid(uuid);
		expect(result).toBe('2024-01-01T21:50:40.128Z');
	});
});
