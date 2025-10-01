import { CronJob } from 'cron';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { scheduleSynchronizedJob, validateCron } from './schedule.js';

vi.mock('cron', async (importOriginal) => {
	const actual = (await importOriginal()) as any;

	return {
		...actual,
		CronJob: vi.fn(),
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('schedule', () => {
	describe('validateCron', () => {
		test('Returns true for valid cron expression', () => {
			const result = validateCron('0 0 * * *');
			expect(result).toBe(true);
		});

		test('Returns false for invalid cron expression', () => {
			const result = validateCron('#');
			expect(result).toBe(false);
		});
	});

	describe('scheduleSynchronizedJob', () => {
		test('Creates CronJob with correct parameters', () => {
			const mockCallback = vi.fn();
			const cronExpression = '0 0 23 * * *';
			const jobId = 'test-job-id';

			scheduleSynchronizedJob(jobId, cronExpression, mockCallback);

			expect(CronJob).toHaveBeenCalledWith(cronExpression, expect.any(Function), null, true);
		});
	});
});
