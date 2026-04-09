import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as schedule from '../utils/schedule.js';
import { default as oauthCleanupSchedule } from './oauth-cleanup.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({}),
}));

vi.mock('../services/mcp-oauth.js', () => ({
	McpOAuthService: vi.fn().mockImplementation(() => ({
		cleanup: vi.fn().mockResolvedValue(undefined),
	})),
}));

vi.spyOn(schedule, 'scheduleSynchronizedJob');
vi.spyOn(schedule, 'validateCron');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({ MCP_OAUTH_CLEANUP_SCHEDULE: '*/15 * * * *' });
});

afterEach(() => {
	vi.clearAllMocks();
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
});
