import { afterAll, beforeAll, expect, SpyInstance, test, vi } from 'vitest';

import { stall } from './stall';

let performanceNowSpy: SpyInstance;

beforeAll(() => {
	vi.useFakeTimers();

	// fake timers doesn't fake performance.now(), so this is used to mock it
	performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
});

afterAll(() => {
	vi.useRealTimers();
});

const STALL_TIME = 100;

test('does not stall if elapsed time has already past the stall time', () => {
	const startTime = performance.now();

	// intentionally advance past the stall time first
	performanceNowSpy.mockReturnValueOnce(1000);

	stall(STALL_TIME, startTime);

	expect(vi.getTimerCount()).toBe(0);
});

test('should stall for a set amount of time', () => {
	const startTime = performance.now();

	stall(STALL_TIME, startTime);

	expect(vi.getTimerCount()).toBe(1);

	vi.advanceTimersByTime(STALL_TIME);

	expect(vi.getTimerCount()).toBe(0);
});
