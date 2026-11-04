import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SynchronizedClock } from '../synchronization.js';
import { scheduleSynchronizedJob, validateCron } from './schedule.js';

const clock = vi.hoisted(() => ({ set: vi.fn(), reset: vi.fn() }));

vi.mock('../synchronization.js', () => ({
	SynchronizedClock: vi.fn(function () {
		return clock;
	}),
}));

const oneHour = 60 * 60 * 1000;
const maxSetTimeout = Math.pow(2, 31) - 1;

describe('validateCron', () => {
	test.each([
		'* * * * *',
		'0 0 * * *',
		'*/5 * * * *',
		'1,15,30 * * * *',
		'1-30/5 * * * *',
		'0 9 * * 1-5',
		'0 0 * * 0',
		'0 0 * * 7',
		'0 0 29 2 *',
		'* * * * * *',
		'*/10 * * * * *',
	])('accepts "%s"', (rule) => {
		expect(validateCron(rule)).toBe(true);
	});

	test.each([
		'',
		'invalid',
		'* * * *',
		'* * * * * * *',
		'60 * * * *',
		'* 24 * * *',
		'0 0 0 * *',
		'0 0 32 * *',
		'0 0 * 13 *',
		'0 0 * * 8',
		'*/0 * * * *',
	])('rejects "%s"', (rule) => {
		expect(validateCron(rule)).toBe(false);
	});
});

describe('scheduleSynchronizedJob', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2025, 0, 1, 0, 0, 1));

		clock.set.mockResolvedValue(true);
		clock.reset.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	test('keys the clock by job id and rule', async () => {
		const job = scheduleSynchronizedJob('test-key', '0 * * * *', vi.fn());

		expect(SynchronizedClock).toHaveBeenCalledWith('test-key:0 * * * *');

		await job.stop();
	});

	test('claims each tick by setting the clock to the next run time', async () => {
		const job = scheduleSynchronizedJob('test-claim', '0 * * * *', vi.fn());

		await vi.advanceTimersByTimeAsync(2 * oneHour);

		expect(clock.set.mock.calls).toEqual([[new Date(2025, 0, 1, 2).getTime()], [new Date(2025, 0, 1, 3).getTime()]]);

		await job.stop();
	});

	test('skips the callback for ticks already claimed by another instance', async () => {
		const callback = vi.fn();

		clock.set.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

		const job = scheduleSynchronizedJob('test-claimed', '0 * * * *', callback);

		await vi.advanceTimersByTimeAsync(3 * oneHour);

		expect(clock.set).toHaveBeenCalledTimes(3);
		expect(callback).toHaveBeenCalledOnce();

		await job.stop();
	});

	test('relies on cron to run a job scheduled beyond the setTimeout limit', async () => {
		const callback = vi.fn();
		const start = Date.now();
		const fireTime = new Date(2026, 0, 1).getTime();

		expect(fireTime - start).toBeGreaterThan(maxSetTimeout);

		const job = scheduleSynchronizedJob('test-yearly', '0 0 1 1 *', callback);

		await vi.advanceTimersByTimeAsync(fireTime - start - 1);

		expect(callback).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);

		expect(callback).toHaveBeenCalledOnce();

		await job.stop();
	});

	test('stops the job and resets the clock on stop', async () => {
		const callback = vi.fn();
		const job = scheduleSynchronizedJob('test-stop', '0 * * * *', callback);

		await vi.advanceTimersByTimeAsync(3 * oneHour);

		expect(callback).toHaveBeenCalledTimes(3);

		await job.stop();

		expect(clock.reset).toHaveBeenCalledOnce();

		await vi.advanceTimersByTimeAsync(3 * oneHour);

		expect(callback).toHaveBeenCalledTimes(3);
		expect(vi.getTimerCount()).toBe(0);
	});
});
