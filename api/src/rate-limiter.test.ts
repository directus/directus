import { useEnv } from '@directus/env';
import { describe, expect, test, vi } from 'vitest';
import { createRateLimiter } from './rate-limiter.js';

vi.mock('@directus/env');

function mockEnv(env: Record<string, unknown>) {
	(useEnv as ReturnType<typeof vi.fn>).mockReturnValue({
		RATE_LIMITER_STORE: 'memory',
		RATE_LIMITER_POINTS: 50,
		...env,
	});
}

describe('createRateLimiter', () => {
	test('reads its configuration from the given prefix', () => {
		mockEnv({ RATE_LIMITER_KEY_PREFIX: 'global' });

		expect(createRateLimiter('RATE_LIMITER').keyPrefix).toBe('global');
	});

	test('overrides take precedence over the values read from the prefix', () => {
		mockEnv({ RATE_LIMITER_KEY_PREFIX: 'global' });

		const limiter = createRateLimiter('RATE_LIMITER', { keyPrefix: 'websocket' });

		expect(limiter.keyPrefix).toBe('websocket');
		// the rest of the prefix config is still applied
		expect(limiter.points).toBe(50);
	});
});
