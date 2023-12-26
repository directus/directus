import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getCache } from '../../cache.js';
import { useEnv } from '../../env.js';
import { scheduleSynchronizedJob } from '../../utils/schedule.js';
import { initTelemetry, jobCallback } from './init-telemetry.js';
import { track } from './track.js';

vi.mock('./track.js');
vi.mock('../../cache.js');

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('../../env.js', () => ({ useEnv: vi.fn().mockReturnValue({}) }));

vi.mock('../../utils/schedule.js');

let mockCache: ReturnType<typeof getCache>;

beforeEach(() => {
	mockCache = { lockCache: { get: vi.fn(), set: vi.fn() } } as unknown as ReturnType<typeof getCache>;

	vi.mocked(getCache).mockReturnValue(mockCache);
	vi.mocked(useEnv).mockReturnValue({ TELEMETRY: true });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('initTelemetry', () => {
	test('Returns early when telemetry is disabled', async () => {
		vi.mocked(useEnv).mockReturnValue({ TELEMETRY: false });

		const res = await initTelemetry();

		expect(res).toBe(false);
	});

	test('Schedules synchronized job', async () => {
		await initTelemetry();
		expect(scheduleSynchronizedJob).toHaveBeenCalledWith('telemetry', '0 */6 * * *', jobCallback);
	});

	test('Sets lock and calls track without waiting if lock is not set yet', async () => {
		vi.mocked(mockCache.lockCache.get).mockResolvedValue(null as any);

		await initTelemetry();

		expect(mockCache.lockCache.set).toHaveBeenCalledWith('telemetry-lock', true, 30000);
		expect(track).toHaveBeenCalledWith({ wait: false });
	});

	test('Returns true on successful init', async () => {
		const res = await initTelemetry();
		expect(res).toBe(true);
	});
});

describe('jobCallback', () => {
	test('Calls track', () => {
		jobCallback();
		expect(track).toHaveBeenCalledWith();
	});
});
