import type { License } from '@directus/license';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getLicenseManager } from '../license/manager.js';
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

vi.mock('../license/manager.js');

vi.mock('./utils/duration-to-cron.js');

const refresh = vi.fn();
const stop = vi.fn();
const getLicense = vi.fn();

beforeEach(() => {
	vi.mocked(getLicenseManager).mockReturnValue({ refresh, getLicense } as any);
	vi.mocked(durationToCron).mockReturnValue('0 0 0/1 * * *');
	vi.mocked(schedule.scheduleSynchronizedJob).mockReturnValue({ stop });
	getLicense.mockResolvedValue({ meta: { validation_interval: 3600 } } as License);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('license', () => {
	test('invalid cron does not schedule a job', async () => {
		vi.mocked(durationToCron).mockReturnValue('not-a-cron');

		await expect(licenseSchedule()).resolves.toBe(false);
		expect(schedule.validateCron).toHaveBeenCalledWith('not-a-cron');
		expect(schedule.scheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	test('validation_interval of -1 skips scheduling', async () => {
		getLicense.mockResolvedValue({ meta: { validation_interval: -1 } } as License);

		await expect(licenseSchedule()).resolves.toBe(false);
	});

	test('trigger with unchanged license/interval calls refresh', async () => {
		await licenseSchedule();
		const [, , onTick] = vi.mocked(schedule.scheduleSynchronizedJob).mock.calls[0]!;

		await onTick(new Date());

		expect(refresh).toHaveBeenCalledOnce();
	});

	test('trigger with changed validation_interval reschedules', async () => {
		getLicense
			.mockResolvedValueOnce({ meta: { validation_interval: 3600 } } as License) // initial boot
			.mockResolvedValueOnce({ meta: { validation_interval: 7200 } } as License) // tick detects change
			.mockResolvedValueOnce({ meta: { validation_interval: 7200 } } as License); // recursive schedule()

		await licenseSchedule();
		const [, , onTick] = vi.mocked(schedule.scheduleSynchronizedJob).mock.calls[0]!;
		stop.mockClear();
		vi.mocked(schedule.scheduleSynchronizedJob).mockClear();

		await onTick(new Date());

		expect(refresh).not.toHaveBeenCalled();
		expect(stop).toHaveBeenCalled();
		expect(schedule.scheduleSynchronizedJob).toHaveBeenCalledTimes(1);
	});

	test('trigger with changed validation_interval to -1 stops without reschedule', async () => {
		getLicense
			.mockResolvedValueOnce({ meta: { validation_interval: 3600 } } as License)
			.mockResolvedValueOnce({ meta: { validation_interval: -1 } } as License);

		await licenseSchedule();
		const [, , onTick] = vi.mocked(schedule.scheduleSynchronizedJob).mock.calls[0]!;
		stop.mockClear();
		vi.mocked(schedule.scheduleSynchronizedJob).mockClear();

		await onTick(new Date());

		expect(stop).toHaveBeenCalledOnce();
		expect(refresh).not.toHaveBeenCalled();
		expect(schedule.scheduleSynchronizedJob).not.toHaveBeenCalled();
	});
});
