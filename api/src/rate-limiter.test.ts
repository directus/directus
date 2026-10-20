import { describe, expect, test, vi } from 'vitest';
import { createRateLimiter } from './rate-limiter.js';

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('./test-utils/env.js');
	return mockUseEnv({ RATE_LIMITER_STORE: 'memory', RATE_LIMITER_POINTS: 50, RATE_LIMITER_KEY_PREFIX: 'global' });
});

describe('createRateLimiter', () => {
	test('reads its configuration from the given prefix', () => {
		expect(createRateLimiter('RATE_LIMITER').keyPrefix).toBe('global');
	});

	test('overrides take precedence over the values read from the prefix', () => {
		const limiter = createRateLimiter('RATE_LIMITER', { keyPrefix: 'websocket' });

		expect(limiter.keyPrefix).toBe('websocket');
		// the rest of the prefix config is still applied
		expect(limiter.points).toBe(50);
	});
});
