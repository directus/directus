import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as schedule from '../utils/schedule.js';
import { handleRetentionJob, retention } from './retention.js';

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
	test('Returns early when retention is disabled', () => {
		vi.mocked(useEnv).mockReturnValue({ RETENTION_ENABLED: false, RETENTION_SCHEDULE: '0 0 * * *' });

		const res = retention();

		expect(res).toBe(false);
	});

	test('Returns early for invalid retention schedule', () => {
		vi.mocked(useEnv).mockReturnValue({ RETENTION_ENABLED: true, RETENTION_SCHEDULE: '#' });

		const res = retention();

		expect(schedule.validateCron).toHaveBeenCalledWith('#');

		expect(res).toBe(false);
	});

	test('Schedules synchronized job', () => {
		retention();
		expect(schedule.validateCron).toHaveBeenCalledWith('0 0 * * *');
		expect(schedule.scheduleSynchronizedJob).toHaveBeenCalledWith('retention', '0 0 * * *', handleRetentionJob);
	});

	test('Returns true on successful init', () => {
		const res = retention();
		expect(res).toBe(true);
	});
});
