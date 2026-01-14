import { useEnv } from '@directus/env';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../logger/index.js';
import { isLoginRedirectAllowed } from './is-login-redirect-allowed.js';

vi.mock('@directus/env');
vi.mock('../../logger/index.js');

const mockLogger = {
	error: vi.fn(),
	warn: vi.fn(),
};

vi.mocked(useLogger).mockReturnValue(mockLogger as any);

const PUBLIC_URL = 'https://directus.app';

describe('isLoginRedirectAllowed', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL,
		});
	});

	describe('empty or invalid redirect', () => {
		test('returns true when redirect is undefined', () => {
			const result = isLoginRedirectAllowed('github', undefined);

			expect(result).toBe(true);
		});

		test('returns true when redirect is empty string', () => {
			const result = isLoginRedirectAllowed('github', '');

			expect(result).toBe(true);
		});

		test('returns false when redirect is not a string', () => {
			const result = isLoginRedirectAllowed('github', 123);

			expect(result).toBe(false);
		});
	});

	describe('relative path redirects', () => {
		test('returns true for relative path redirect', () => {
			const result = isLoginRedirectAllowed('github', '/admin/users');

			expect(result).toBe(true);
		});

		test('returns true for root path redirect', () => {
			const result = isLoginRedirectAllowed('github', '/');

			expect(result).toBe(true);
		});

		test('returns false for protocol-relative URL (//example.com)', () => {
			const result = isLoginRedirectAllowed('github', '//malicious.com/test');

			expect(result).toBe(false);
		});
	});

	describe('cross-domain redirects', () => {
		test('allows cross-domain redirect when in REDIRECT_ALLOW_LIST', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'https://api.directus.io',
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://frontend.com/auth/callback',
			});

			const result = isLoginRedirectAllowed('github', 'https://frontend.com/auth/callback');

			expect(result).toBe(true);
		});

		test('rejects cross-domain redirect when NOT in REDIRECT_ALLOW_LIST', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'https://api.directus.io',
			});

			const result = isLoginRedirectAllowed('github', 'https://frontend.com/auth/callback');

			expect(result).toBe(false);
		});

		test('allows redirect to PUBLIC_URL origin without REDIRECT_ALLOW_LIST', () => {
			const result = isLoginRedirectAllowed('github', `${PUBLIC_URL}/admin`);

			expect(result).toBe(true);
		});
	});

	describe('AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST', () => {
		test('allows redirect when in provider-specific allow list', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://example.com/custom',
			});

			const result = isLoginRedirectAllowed('github', 'https://example.com/custom');

			expect(result).toBe(true);
		});

		test('allows redirect when in provider-specific allow list (array)', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: ['https://example.com/custom1', 'https://example.com/custom2'],
			});

			const result = isLoginRedirectAllowed('github', 'https://example.com/custom2');

			expect(result).toBe(true);
		});

		test('falls back to PUBLIC_URL check when not in provider-specific allow list', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://example.com/allowed',
			});

			// Not in allow list, but matches PUBLIC_URL origin
			const result = isLoginRedirectAllowed('github', `${PUBLIC_URL}/other-path`);

			expect(result).toBe(true);
		});

		test('supports deep link URLs for mobile apps', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'myapp://auth/callback',
			});

			const result = isLoginRedirectAllowed('github', 'myapp://auth/callback');

			expect(result).toBe(true);
		});
	});

	describe('PUBLIC_URL fallback', () => {
		test('rejects redirect when PUBLIC_URL is invalid', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'invalid-url',
			});

			const result = isLoginRedirectAllowed('github', 'https://example.com/admin');

			expect(result).toBe(false);
			expect(mockLogger.error).toHaveBeenCalledWith('Invalid PUBLIC_URL for login redirect');
		});

		test('rejects redirect when not in allow list and not PUBLIC_URL origin', () => {
			const result = isLoginRedirectAllowed('github', 'https://different.com/admin');

			expect(result).toBe(false);
		});

		test('allows redirect matching PUBLIC_URL origin', () => {
			const result = isLoginRedirectAllowed('github', `${PUBLIC_URL}/any/path`);

			expect(result).toBe(true);
		});
	});

	describe('edge cases', () => {
		test('handles URL with query parameters', () => {
			const result = isLoginRedirectAllowed('github', `${PUBLIC_URL}/admin?tab=users`);

			expect(result).toBe(true);
		});

		test('handles URL with hash fragment', () => {
			const result = isLoginRedirectAllowed('github', `${PUBLIC_URL}/admin#section`);

			expect(result).toBe(true);
		});

		test('handles URL with both query and hash', () => {
			const result = isLoginRedirectAllowed('github', `${PUBLIC_URL}/admin?tab=users#top`);

			expect(result).toBe(true);
		});

		test('protocol must match (http vs https)', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'https://directus.app',
			});

			const result = isLoginRedirectAllowed('github', 'http://directus.app/admin');

			expect(result).toBe(false);
		});

		test('port must match when PUBLIC_URL has custom port', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'http://localhost:8055',
			});

			// Different port should be rejected
			const result = isLoginRedirectAllowed('github', 'http://localhost:3000/admin');

			expect(result).toBe(false);
		});

		test('allows redirect when port matches PUBLIC_URL', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'http://localhost:8055',
			});

			const result = isLoginRedirectAllowed('github', 'http://localhost:8055/admin');

			expect(result).toBe(true);
		});
	});
});
