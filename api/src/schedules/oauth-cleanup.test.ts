import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../logger/index.js';
import { getSchema } from '../utils/get-schema.js';
import * as schedule from '../utils/schedule.js';
import { default as oauthCleanupSchedule } from './oauth-cleanup.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({}),
}));

const mockCleanup = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/mcp-oauth/index.js', () => ({
	McpOAuthService: vi.fn().mockImplementation(() => ({
		cleanup: mockCleanup,
	})),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		error: vi.fn(),
	}),
}));

vi.spyOn(schedule, 'scheduleSynchronizedJob');
vi.spyOn(schedule, 'validateCron');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({ MCP_OAUTH_CLEANUP_SCHEDULE: '*/15 * * * *' });
});

afterEach(() => {
	vi.clearAllMocks();
	mockCleanup.mockResolvedValue(undefined);
});

describe('oauth cleanup schedule', () => {
	test('returns early for invalid cleanup schedule', async () => {
		vi.mocked(useEnv).mockReturnValue({ MCP_OAUTH_CLEANUP_SCHEDULE: '#' });

		const res = await oauthCleanupSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('#');
		expect(schedule.scheduleSynchronizedJob).not.toHaveBeenCalled();

		expect(res).toBe(false);
	});

	test('schedules synchronized cleanup job with env cron', async () => {
		const res = await oauthCleanupSchedule();

		expect(schedule.validateCron).toHaveBeenCalledWith('*/15 * * * *');

		expect(schedule.scheduleSynchronizedJob).toHaveBeenCalledWith(
			'oauth-cleanup',
			'*/15 * * * *',
			expect.any(Function),
		);

		expect(res).toBe(true);
	});

	test('scheduled callback gets schema and runs cleanup', async () => {
		await oauthCleanupSchedule();

		const callback = vi.mocked(schedule.scheduleSynchronizedJob).mock.calls[0]![2];

		await callback();

		expect(getSchema).toHaveBeenCalled();
		expect(mockCleanup).toHaveBeenCalled();
	});

	test('scheduled callback logs cleanup errors', async () => {
		const error = new Error('cleanup failed');
		mockCleanup.mockRejectedValueOnce(error);

		await oauthCleanupSchedule();

		const callback = vi.mocked(schedule.scheduleSynchronizedJob).mock.calls[0]![2];

		await callback();

		expect(useLogger().error).toHaveBeenCalledWith(error, 'MCP OAuth cleanup failed');
	});
});
