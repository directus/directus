import { scheduleSynchronizedJob, validateCron } from './schedule.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock SynchronizedClock to isolate scheduling logic
vi.mock('../synchronization.js', () => ({
	SynchronizedClock: vi.fn().mockImplementation(() => ({
		set: vi.fn().mockResolvedValue(true),
		reset: vi.fn().mockResolvedValue(undefined),
	})),
}));

describe('validateCron', () => {
	test('Returns true for valid cron expression', () => {
		expect(validateCron('0 0 * * *')).toBe(true);
		expect(validateCron('*/5 * * * *')).toBe(true);
		expect(validateCron('0 23 * * *')).toBe(true);
	});

	test('Returns false for invalid cron expression', () => {
		expect(validateCron('#')).toBe(false);
		expect(validateCron('invalid')).toBe(false);
		expect(validateCron('60 * * * *')).toBe(false);
	});
});

describe('scheduleSynchronizedJob', () => {
	describe('long-running scenarios (25+ days)', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.clearAllTimers();
			vi.useRealTimers();
		});

		test('Should execute daily job for 26 consecutive days', async () => {
			const callback = vi.fn().mockResolvedValue(undefined);
			const startTime = new Date('2025-01-01T22:00:00.000Z');

			vi.setSystemTime(startTime);
			const job = scheduleSynchronizedJob('test-daily', '0 23 * * *', callback);

			const dayInMs = 24 * 60 * 60 * 1000;
			const oneHourMs = 60 * 60 * 1000;

			// Simulate 26 days (exceeds setTimeout limit of ~24.8 days)
			for (let day = 0; day < 26; day++) {
				const targetTime = new Date(startTime.getTime() + day * dayInMs + oneHourMs);
				vi.setSystemTime(targetTime);
				await vi.runOnlyPendingTimersAsync();
			}

			expect(callback).toHaveBeenCalledTimes(26);
			await job.stop();
		});

		test('Should execute hourly job beyond setTimeout limit', async () => {
			const callback = vi.fn().mockResolvedValue(undefined);
			const startTime = new Date('2025-01-01T00:00:00.000Z');

			vi.setSystemTime(startTime);
			const job = scheduleSynchronizedJob('test-hourly', '0 * * * *', callback);
			await vi.runOnlyPendingTimersAsync();

			const oneHour = 60 * 60 * 1000;
			const maxSetTimeoutMs = Math.pow(2, 31) - 1; // ~24.8 days
			const hoursToTest = Math.ceil(maxSetTimeoutMs / oneHour) + 24; // Beyond limit + 1 day

			for (let hour = 1; hour <= hoursToTest; hour++) {
				const targetTime = new Date(startTime.getTime() + hour * oneHour);
				vi.setSystemTime(targetTime);
				await vi.runOnlyPendingTimersAsync();
			}

			const maxSetTimeoutHours = Math.floor(maxSetTimeoutMs / oneHour);
			expect(callback.mock.calls.length).toBeGreaterThan(maxSetTimeoutHours);

			await job.stop();
		});

		test('Should execute daily job for 30 days without missing executions', async () => {
			const callback = vi.fn().mockResolvedValue(undefined);
			const startTime = new Date('2025-01-01T22:00:00.000Z');

			vi.setSystemTime(startTime);
			const job = scheduleSynchronizedJob('test-30-days', '0 23 * * *', callback);

			const dayInMs = 24 * 60 * 60 * 1000;
			const oneHourMs = 60 * 60 * 1000;

			// Test 30 consecutive days
			for (let day = 0; day < 30; day++) {
				const targetTime = new Date(startTime.getTime() + day * dayInMs + oneHourMs);
				vi.setSystemTime(targetTime);
				await vi.runOnlyPendingTimersAsync();
			}

			expect(callback).toHaveBeenCalledTimes(30);
			await job.stop();
		});

		test('Should stop job execution after stop() is called', async () => {
			const callback = vi.fn().mockResolvedValue(undefined);
			const startTime = new Date('2025-01-01T00:00:00.000Z');

			vi.setSystemTime(startTime);
			const job = scheduleSynchronizedJob('test-stop', '0 0 * * *', callback);
			await vi.runOnlyPendingTimersAsync();

			// Run for 26 days
			const targetTime = new Date(startTime.getTime() + 26 * 24 * 60 * 60 * 1000);
			vi.setSystemTime(targetTime);
			await vi.runOnlyPendingTimersAsync();

			const callsBeforeStop = callback.mock.calls.length;

			// Stop the job
			await job.stop();

			// Advance one more day
			const afterStopTime = new Date(targetTime.getTime() + 24 * 60 * 60 * 1000);
			vi.setSystemTime(afterStopTime);
			await vi.runOnlyPendingTimersAsync();

			// Should not have any new calls after stop
			expect(callback).toHaveBeenCalledTimes(callsBeforeStop);
		});
	});

	describe('CronJob execution timing', () => {
		test('cron job fires at scheduled time', async () => {
			vi.useFakeTimers();

			const mockCallback = vi.fn();
			const startTime = new Date('2025-01-01T23:55:00.000Z');

			vi.setSystemTime(startTime);

			const { CronJob } = await import('cron');

			// Create a CronJob that fires every minute
			CronJob.from({
				cronTime: '* * * * *',
				onTick: mockCallback,
				start: true,
			});

			// Advance time by 1 minute
			await vi.advanceTimersByTimeAsync(60 * 1000);

			expect(mockCallback).toHaveBeenCalledTimes(1);

			// Advance time by another minute
			await vi.advanceTimersByTimeAsync(60 * 1000);

			expect(mockCallback).toHaveBeenCalledTimes(2);

			vi.useRealTimers();
		});
	});
});
