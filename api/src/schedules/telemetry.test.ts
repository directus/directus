import { getCache } from '../cache.js';
import { jobCallback, default as telemetrySchedule } from './telemetry.js';
import { track } from '../telemetry/index.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';
import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../telemetry/index.js');
vi.mock('../cache.js');

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
	}),
}));

vi.mock('../utils/schedule.js');

let mockCache: ReturnType<typeof getCache>;

beforeEach(() => {
	mockCache = { lockCache: { get: vi.fn(), set: vi.fn() } } as unknown as ReturnType<typeof getCache>;

	vi.mocked(getCache).mockReturnValue(mockCache);
	vi.mocked(useEnv).mockReturnValue({ TELEMETRY: true });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('telemetry', () => {
	test('Returns early when telemetry is disabled', async () => {
		vi.mocked(useEnv).mockReturnValue({ TELEMETRY: false });

		const res = await telemetrySchedule();

		expect(res).toBe(false);
	});

	test('Schedules synchronized job', async () => {
		await telemetrySchedule();

		expect(scheduleSynchronizedJob).toHaveBeenCalledWith('telemetry', '0 */6 * * *', jobCallback);
	});

	test('Sets lock and calls track without waiting if lock is not set yet', async () => {
		vi.mocked(mockCache.lockCache.get).mockResolvedValue(null as any);

		await telemetrySchedule();

		expect(mockCache.lockCache.set).toHaveBeenCalledWith('telemetry-lock', true, 30000);
		expect(track).toHaveBeenCalledWith({ wait: false });
	});

	test('Returns true on successful init', async () => {
		const res = await telemetrySchedule();

		expect(res).toBe(true);
	});
});

describe('jobCallback', () => {
	test('Calls track', () => {
		jobCallback();

		expect(track).toHaveBeenCalledWith();
	});
});
