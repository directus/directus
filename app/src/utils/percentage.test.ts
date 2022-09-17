import { describe, it, expect } from 'vitest';
import { percentage } from '@/utils/percentage';

describe('utils/percentage', () => {
	it('Returns null for undefined upper limits', () => {
		expect(percentage(5, undefined)).toBe(null);
	});

	it('Returns 100 percent remaining for value 0', () => {
		expect(percentage(0, 100)).toBe(100);
	});

	it('Returns the percentage remaining', () => {
		expect(percentage(50, 100)).toBe(50);
	});
});
