import { useEnv } from '../../env.js';
import { redisConfigAvailable } from './redis-config-available.js';

import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../env.js');

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns true if REDIS exists in environment', () => {
	vi.mocked(useEnv).mockReturnValue({
		REDIS: 'redis://test',
	});

	expect(redisConfigAvailable()).toBe(true);
});

test('Returns true if one or more environment variables start with REDIS_', () => {
	vi.mocked(useEnv).mockReturnValue({
		REDIS_HOST: 'test',
		REDIS_PORT: 1234,
	});

	expect(redisConfigAvailable()).toBe(true);
});

test('Returns false if no Redis environment variables exist', () => {
	vi.mocked(useEnv).mockReturnValue({});
});
