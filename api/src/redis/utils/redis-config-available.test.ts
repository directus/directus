import { useEnv } from '@directus/env';
import { afterEach, expect, test, vi } from 'vitest';
import { asEnv } from '../../__utils__/as-env.js';
import { redisConfigAvailable } from './redis-config-available.js';

vi.mock('@directus/env');

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns true if REDIS_ENABLED is true', () => {
	vi.mocked(useEnv).mockReturnValue(
		asEnv({
			REDIS_ENABLED: true,
		}),
	);

	expect(redisConfigAvailable()).toBe(true);
});

test('Returns false if REDIS_ENABLED is false', () => {
	vi.mocked(useEnv).mockReturnValue(
		asEnv({
			REDIS_ENABLED: false,
		}),
	);

	expect(redisConfigAvailable()).toBe(false);
});

test('Returns true if REDIS exists in environment', () => {
	vi.mocked(useEnv).mockReturnValue(
		asEnv({
			REDIS: 'redis://test',
		}),
	);

	expect(redisConfigAvailable()).toBe(true);
});

test('Returns true if one or more environment variables start with REDIS_', () => {
	vi.mocked(useEnv).mockReturnValue(
		asEnv({
			REDIS_HOST: 'test',
			REDIS_PORT: 1234,
		}),
	);

	expect(redisConfigAvailable()).toBe(true);
});

test('Returns false if no Redis environment variables exist', () => {
	vi.mocked(useEnv).mockReturnValue(asEnv({}));
});
