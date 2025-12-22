import { afterAll, beforeAll, expect, test, vi, type MockInstance } from 'vitest';
import { stall } from './stall.js';

let performanceNowSpy: MockInstance;

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

test('should stall for a set amount of time', async () => {
	const startTime = performance.now(); // This will be 0

	// Set up the stall - it should create a timeout for STALL_TIME
	const stallPromise = stall(STALL_TIME, startTime);

	// There should be one timer active
	expect(vi.getTimerCount()).toBe(1);

	// Advance timers and await the promise resolution
	vi.runOnlyPendingTimers();
	await stallPromise;

	// No more timers should be active
	expect(vi.getTimerCount()).toBe(0);
});
