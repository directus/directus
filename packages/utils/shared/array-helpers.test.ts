import { describe, expect, it } from 'vitest';
import { isIn, isTypeIn } from './array-helpers.js';

describe('type helpers for arrays', () => {
	const array = ['foo', 'bar'] as const;

	it('returns true when string is inside array', () => {
		expect(isIn('foo', array)).toBe(true);
	});

	it('returns false when string is not inside array', () => {
		expect(isIn('baz', array)).toBe(false);
	});

	it('returns true when object type string is inside array', () => {
		expect(isTypeIn({ type: 'bar' }, array)).toBe(true);
	});

	it('returns false when object type string is not inside array', () => {
		expect(isTypeIn({ type: 'baz' }, array)).toBe(false);
	});

	it('returns false when object has no type', () => {
		expect(isTypeIn({}, array)).toBe(false);
	});
});
