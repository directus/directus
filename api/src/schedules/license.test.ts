import type { License } from '@directus/license';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getLicense, getLicenseManager } from '../license/manager.js';
import * as schedule from '../utils/schedule.js';
import licenseSchedule from './license.js';
import { durationToCron } from './utils/duration-to-cron.js';

vi.spyOn(schedule, 'scheduleSynchronizedJob');
vi.spyOn(schedule, 'validateCron');

// `@directus/env` is pulled in transitively (logger reads it at import time).
// Same pattern used in the other schedule tests until logger migrates to useLogger everywhere.
vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv();
});

vi.mock('../license/manager.js', () => ({
	getLicense: vi.fn(),
	getLicenseManager: vi.fn(),
}));

vi.mock('./utils/duration-to-cron.js', () => ({
	durationToCron: vi.fn(),
}));

const refresh = vi.fn();

beforeEach(() => {
	vi.mocked(getLicenseManager).mockReturnValue({ refresh } as any);
	vi.mocked(getLicense).mockResolvedValue({ meta: { validation_interval: 3600 } } as License);
	vi.mocked(durationToCron).mockReturnValue('0 0 0/1 * * *');
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('schedule license-check', () => {
	test('passes the license validation_interval through to durationToCron', async () => {
		vi.mocked(getLicense).mockResolvedValue({ meta: { validation_interval: 7200 } } as License);

		await licenseSchedule();

		expect(durationToCron).toHaveBeenCalledWith(7200);
	});

	test('schedules a synchronized job when the generated cron is valid', async () => {
		await licenseSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('0 0 0/1 * * *');

		expect(schedule.scheduleSynchronizedJob).toHaveBeenCalledWith(
			'license-check',
			'0 0 0/1 * * *',
			expect.any(Function),
		);
	});

	test('does not schedule a job when the generated cron is invalid', async () => {
		vi.mocked(durationToCron).mockReturnValue('not-a-cron');

		await licenseSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('not-a-cron');
		expect(schedule.scheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	test('returns false when the cron is invalid', async () => {
		vi.mocked(durationToCron).mockReturnValue('not-a-cron');

		const res = await licenseSchedule();

		expect(res).toBe(false);
	});

	test('returns true on successful init', async () => {
		const res = await licenseSchedule();

		expect(res).toBe(true);
	});

	test('skips scheduling and returns false for the CORE -1 sentinel', async () => {
		vi.mocked(getLicense).mockResolvedValue({ meta: { validation_interval: -1 } } as License);

		const res = await licenseSchedule();

		expect(durationToCron).not.toHaveBeenCalled();
		expect(schedule.validateCron).not.toHaveBeenCalled();
		expect(schedule.scheduleSynchronizedJob).not.toHaveBeenCalled();
		expect(res).toBe(false);
	});

	test('the scheduled tick invokes licenseManager.refresh', async () => {
		await licenseSchedule();

		// Pull the onTick callback that was handed to scheduleSynchronizedJob and run it.
		const [, , onTick] = vi.mocked(schedule.scheduleSynchronizedJob).mock.calls[0]!;
		await onTick(new Date());

		expect(refresh).toHaveBeenCalledOnce();
	});
});
