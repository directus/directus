import { useEnv } from '@directus/env';
import { scheduleJob } from 'node-schedule';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as schedule from '../utils/schedule.js';
import { handleMetricsJob, default as metricsSchedule } from './metrics.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('node-schedule', () => ({
	scheduleJob: vi.fn().mockReturnValue({}),
}));

vi.spyOn(schedule, 'validateCron');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: true, METRICS_SCHEDULE: '0 0 * * *' });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('metrics', () => {
	test('Returns early when metrics is disabled', async () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: false, METRICS_SCHEDULE: '0 0 * * *' });

		const res = await metricsSchedule();

		expect(schedule.validateCron).not.toHaveBeenCalled();
		expect(res).toBe(false);
	});

	test('Returns early for invalid metrics schedule', async () => {
		vi.mocked(useEnv).mockReturnValue({ METRICS_ENABLED: true, METRICS_SCHEDULE: '#' });

		const res = await metricsSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('#');
		expect(res).toBe(false);
	});

	test('Schedules job', async () => {
		await metricsSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('0 0 * * *');
		expect(scheduleJob).toHaveBeenCalledWith('metrics', '0 0 * * *', handleMetricsJob);
	});

	test('Returns true on successful init', async () => {
		const res = await metricsSchedule();

		expect(res).toBe(true);
	});
});
