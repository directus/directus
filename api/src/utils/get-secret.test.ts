import { useEnv } from '@directus/env';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { _cache, getSecret } from './get-secret.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(),
}));

describe('getSecret', () => {
	beforeEach(() => {
		_cache.secret = null;

		vi.mocked(useEnv).mockReturnValue({});
	});

	test('returns the configured secret', () => {
		vi.mocked(useEnv).mockReturnValue({ SECRET: 'configured-secret' });

		expect(getSecret()).toBe('configured-secret');
	});

	test('generates and caches a secret when SECRET is not configured', () => {
		const secret = getSecret();

		expect(secret).toEqual(expect.any(String));
		expect(secret).not.toBe('');
		expect(getSecret()).toBe(secret);
	});
});
