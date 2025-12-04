import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateCallbackUrl } from './generate-callback-url.js';

vi.mock('@directus/env');

import { useEnv } from '@directus/env';

const PUBLIC_URL = 'https://directus.app';

describe('generateCallbackUrl', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL,
		});
	});

	describe('without AUTH_ALLOWED_ORIGINS (legacy/fallback)', () => {
		test('falls back to PUBLIC_URL when AUTH_ALLOWED_ORIGINS is not set', () => {
			const result = generateCallbackUrl('github', 'https://other-domain.com');

			expect(result).toBe(`${PUBLIC_URL}/auth/login/github/callback`);
		});

		test('falls back to PUBLIC_URL when request origin does not match any allowed origin', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_ALLOWED_ORIGINS: 'https://api.directus.io',
			});

			const result = generateCallbackUrl('github', 'https://unknown.com');

			expect(result).toBe(`${PUBLIC_URL}/auth/login/github/callback`);
		});
	});

	describe('with AUTH_ALLOWED_ORIGINS', () => {
		test('uses matching origin from AUTH_ALLOWED_ORIGINS', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_ALLOWED_ORIGINS: 'https://api-eu.directus.io,https://api-us.directus.io',
			});

			const result = generateCallbackUrl('github', 'https://api-us.directus.io');

			expect(result).toBe('https://api-us.directus.io/auth/login/github/callback');
		});

		test('preserves subpath from matched AUTH_ALLOWED_ORIGINS entry', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_ALLOWED_ORIGINS: 'https://mysite.com/api',
			});

			// Request origin is just the host, but AUTH_ALLOWED_ORIGINS has subpath
			const result = generateCallbackUrl('github', 'https://mysite.com');

			expect(result).toBe('https://mysite.com/api/auth/login/github/callback');
		});

		test('works with array of allowed origins', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_ALLOWED_ORIGINS: ['https://api-eu.directus.io', 'https://api-us.directus.io/v1'],
			});

			const result = generateCallbackUrl('github', 'https://api-us.directus.io');

			expect(result).toBe('https://api-us.directus.io/v1/auth/login/github/callback');
		});

		test('matches on protocol and hostname only', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_ALLOWED_ORIGINS: 'https://api.directus.io/subpath',
			});

			// Even though request origin doesn't have subpath, it should match
			const result = generateCallbackUrl('github', 'https://api.directus.io');

			expect(result).toBe('https://api.directus.io/subpath/auth/login/github/callback');
		});

		test('skips invalid URLs in AUTH_ALLOWED_ORIGINS', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_ALLOWED_ORIGINS: 'invalid-url,https://api.directus.io',
			});

			const result = generateCallbackUrl('github', 'https://api.directus.io');

			expect(result).toBe('https://api.directus.io/auth/login/github/callback');
		});
	});

	describe('provider name handling', () => {
		test('includes provider name in callback path', () => {
			const result = generateCallbackUrl('google', 'https://directus.app');

			expect(result).toBe(`${PUBLIC_URL}/auth/login/google/callback`);
		});
	});
});
