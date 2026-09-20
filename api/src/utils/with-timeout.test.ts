import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { withTimeout } from './with-timeout.js';

describe('withTimeout', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('should resolve when the promise settles first', async () => {
		await expect(withTimeout(Promise.resolve('result'), 1000)).resolves.toBe('result');
	});

	test('should reject with the original error when the promise rejects first', async () => {
		await expect(withTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
	});

	test('should reject when the timeout expires first', async () => {
		const timedOut = expect(withTimeout(new Promise(() => {}), 1000)).rejects.toThrow('Timeout of 1000ms exceeded');

		await vi.advanceTimersByTimeAsync(1000);
		await timedOut;
	});

	test('should reject with the given message when one is passed', async () => {
		const timedOut = expect(withTimeout(new Promise(() => {}), 1000, 'took too long')).rejects.toThrow('took too long');

		await vi.advanceTimersByTimeAsync(1000);
		await timedOut;
	});

	test('should leave no pending timer once the promise settles', async () => {
		await withTimeout(Promise.resolve('result'), 1000);

		expect(vi.getTimerCount()).toBe(0);
	});
});
