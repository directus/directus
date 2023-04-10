import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import config from './index.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test('promise resolves after the configured duration in milliseconds', () => {
	const milliseconds = 1000;

	// asserts there is no timer (setTimeout) running yet
	expect(vi.getTimerCount()).toBe(0);

	// intentionally don't await to assert the timer
	config.handler({ milliseconds }, {} as any);

	// asserts there is 1 timer (setTimeout) running now
	expect(vi.getTimerCount()).toBe(1);

	vi.advanceTimersByTime(milliseconds);

	// asserts there is no longer any timer (setTimeout) running
	expect(vi.getTimerCount()).toBe(0);
});

test('casts string input for milliseconds to number', () => {
	const milliseconds = '1000';

	// asserts there is no timer (setTimeout) running yet
	expect(vi.getTimerCount()).toBe(0);

	// intentionally don't await to assert the timer
	config.handler({ milliseconds }, {} as any);

	// asserts there is 1 timer (setTimeout) running now
	expect(vi.getTimerCount()).toBe(1);

	vi.advanceTimersByTime(Number(milliseconds));

	// asserts there is no longer any timer (setTimeout) running
	expect(vi.getTimerCount()).toBe(0);
});
