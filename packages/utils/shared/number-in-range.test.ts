import { MAX_SAFE_INT32, MAX_SAFE_INT64, MIN_SAFE_INT32, MIN_SAFE_INT64 } from '@directus/constants';
import { describe, expect, test } from 'vitest';
import { numberInRange } from './number-in-range.js';

describe('integer', () => {
	const info = { type: 'integer', precision: null, scale: null } as const;

	test('accepts the 32-bit bounds', () => {
		expect(numberInRange(MAX_SAFE_INT32, info)).toBe(true);
		expect(numberInRange(MIN_SAFE_INT32, info)).toBe(true);
	});

	test('rejects values outside the 32-bit bounds', () => {
		expect(numberInRange(MAX_SAFE_INT32 + 1, info)).toBe(false);
		expect(numberInRange(MIN_SAFE_INT32 - 1, info)).toBe(false);
	});
});

describe('bigInteger', () => {
	const info = { type: 'bigInteger', precision: null, scale: null } as const;

	test('accepts the 64-bit bounds', () => {
		expect(numberInRange(MAX_SAFE_INT64, info)).toBe(true);
		expect(numberInRange(MIN_SAFE_INT64, info)).toBe(true);
	});

	test('rejects values outside the 64-bit bounds', () => {
		expect(numberInRange(MAX_SAFE_INT64 + 1n, info)).toBe(false);
		expect(numberInRange(MIN_SAFE_INT64 - 1n, info)).toBe(false);
	});
});

describe('decimal', () => {
	test('uses precision and scale for its bounds', () => {
		const info = { type: 'decimal', precision: 5, scale: 2 } as const;

		expect(numberInRange(999.99, info)).toBe(true);
		expect(numberInRange(-999.99, info)).toBe(true);
		expect(numberInRange(1000, info)).toBe(false);
		expect(numberInRange(-1000, info)).toBe(false);
	});
});

test('float leaves range checks to the database', () => {
	expect(numberInRange(Number.MAX_VALUE, { type: 'float', precision: null, scale: null })).toBe(true);
});
