import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as schedule from '../utils/schedule.js';
import { handleRetentionJob, default as retentionSchedule } from './retention.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.spyOn(schedule, 'scheduleSynchronizedJob');
vi.spyOn(schedule, 'validateCron');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({ RETENTION_ENABLED: true, RETENTION_SCHEDULE: '0 0 * * *' });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('retention', () => {
	test('Returns early when retention is disabled', async () => {
		vi.mocked(useEnv).mockReturnValue({ RETENTION_ENABLED: false, RETENTION_SCHEDULE: '0 0 * * *' });

		const res = await retentionSchedule();

		expect(schedule.validateCron).not.toHaveBeenCalled();
		expect(res).toBe(false);
	});

	test('Returns early for invalid retention schedule', async () => {
		vi.mocked(useEnv).mockReturnValue({ RETENTION_ENABLED: true, RETENTION_SCHEDULE: '#' });

		const res = await retentionSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('#');
		expect(res).toBe(false);
	});

	test('Schedules synchronized job', async () => {
		await retentionSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('0 0 * * *');
		expect(schedule.scheduleSynchronizedJob).toHaveBeenCalledWith('retention', '0 0 * * *', handleRetentionJob);
	});

	test('Returns true on successful init', async () => {
		const res = await retentionSchedule();

		expect(res).toBe(true);
	});
});
