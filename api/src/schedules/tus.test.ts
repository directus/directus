import { afterEach, describe, expect, test, vi } from 'vitest';
import * as schedule from '../utils/schedule.js';
import tusSchedule from './tus.js';

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
		TUS_ENABLED: true,
		TUS_CLEANUP_SCHEDULE: '0 */6 * * *',
	}),
}));

vi.spyOn(schedule, 'scheduleSynchronizedJob');
vi.spyOn(schedule, 'validateCron');

afterEach(() => {
	vi.clearAllMocks();
});

describe('tus', () => {
	test('Schedules synchronized job', async () => {
		await tusSchedule();

		expect(schedule.scheduleSynchronizedJob).toHaveBeenCalled();
	});

	test('Returns true on successful init', async () => {
		const res = await tusSchedule();

		expect(res).toBe(true);
	});
});
