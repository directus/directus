import { createCache } from '@directus/memory';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { redisConfigAvailable, useRedis } from '../../../redis/index.js';

vi.mock('@directus/memory', () => ({
	createCache: vi.fn(() => ({
		usingLock: vi.fn(),
	})),
}));

vi.mock('../../../redis/index.js', () => ({
	useRedis: vi.fn(),
	redisConfigAvailable: vi.fn().mockReturnValue(true),
}));

describe('Store', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	test('creates store with redis config when available', async () => {
		const mockRedis = { status: 'mocked' };
		vi.mocked(useRedis).mockReturnValue(mockRedis as any);

		await import('./store.js?update=' + Date.now());

		expect(createCache).toHaveBeenCalledWith({
			type: 'redis',
			namespace: 'collab',
			redis: mockRedis,
		});
	});

	test('creates local store when redis is unavailable', async () => {
		vi.mocked(redisConfigAvailable).mockReturnValue(false);

		await import('./store.js?update=' + Date.now());

		expect(createCache).toHaveBeenCalledWith({
			type: 'local',
		});
	});
});
