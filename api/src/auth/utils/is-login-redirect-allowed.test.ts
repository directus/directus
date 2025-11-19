import { beforeEach, describe, expect, test, vi } from 'vitest';
import { isLoginRedirectAllowed } from './is-login-redirect-allowed.js';

vi.mock('@directus/env');
vi.mock('../../logger/index.js');

import { useEnv } from '@directus/env';
import { useLogger } from '../../logger/index.js';

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
			const result = isLoginRedirectAllowed('github', PUBLIC_URL, undefined);

			expect(result).toBe(true);
		});

		test('returns true when redirect is empty string', () => {
			const result = isLoginRedirectAllowed('github', PUBLIC_URL, '');

			expect(result).toBe(true);
		});

		test('returns false when redirect is not a string', () => {
			const result = isLoginRedirectAllowed('github', PUBLIC_URL, 123);

			expect(result).toBe(false);
		});

		describe('relative path redirects', () => {
			test('returns true for relative path redirect', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, '/admin/users');

				expect(result).toBe(true);
			});

			test('returns true for root path redirect', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, '/');

				expect(result).toBe(true);
			});

			test('returns false for protocol-relative URL (//example.com)', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, '//malicious.com/test');

				expect(result).toBe(false);
			});
		});

		describe('origin matching', () => {
			test('returns false when redirect origin does not match request origin', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, 'https://different.com/admin');

				expect(result).toBe(false);
			});

			test('returns false when redirect origin differs by protocol', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, 'http://example.com/admin');

				expect(result).toBe(false);
			});

			test('allows redirect when port differs', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, `${PUBLIC_URL}:8080/admin`);

				expect(result).toBe(true);
			});
		});

		describe('AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST', () => {
			test('allows redirect when in provider-specific allow list', () => {
				vi.mocked(useEnv).mockReturnValue({
					AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://example.com/custom',
				});

				const result = isLoginRedirectAllowed('github', 'https://example.com', 'https://example.com/custom');

				expect(result).toBe(true);
			});

			test('allows redirect when in provider-specific allow list (array)', () => {
				vi.mocked(useEnv).mockReturnValue({
					AUTH_GITHUB_REDIRECT_ALLOW_LIST: ['https://example.com/custom1', 'https://example.com/custom2'],
				});

				const result = isLoginRedirectAllowed('github', 'https://example.com', 'https://example.com/custom2');

				expect(result).toBe(true);
			});

			test('falls back to PUBLIC_URL check when not in provider-specific allow list', () => {
				vi.mocked(useEnv).mockReturnValue({
					PUBLIC_URL,
					AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://example.com/allowed',
				});

				// Not in allow list, but matches PUBLIC_URL, so should pass
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, `${PUBLIC_URL}/forbidden`);

				expect(result).toBe(true);
			});
		});

		describe('PUBLIC_URL fallback', () => {
			test('rejects redirect when PUBLIC_URL is invalid', () => {
				vi.mocked(useEnv).mockReturnValue({
					PUBLIC_URL: 'invalid-url',
				});

				const result = isLoginRedirectAllowed('github', 'https://example.com', 'https://example.com/admin');

				expect(result).toBe(false);
				expect(mockLogger.error).toHaveBeenCalledWith('Invalid PUBLIC_URL for login redirect');
			});

			test('rejects redirect when PUBLIC_URL origin does not match', () => {
				const result = isLoginRedirectAllowed('github', 'https://example.com', 'https://example.com/admin');

				expect(result).toBe(false);
			});
		});

		describe('edge cases', () => {
			test('handles URL with query parameters', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, `${PUBLIC_URL}/admin?tab=users`);

				expect(result).toBe(true);
			});

			test('handles URL with hash fragment', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, `${PUBLIC_URL}/admin#section`);

				expect(result).toBe(true);
			});

			test('handles URL with both query and hash', () => {
				const result = isLoginRedirectAllowed('github', PUBLIC_URL, `${PUBLIC_URL}/admin?tab=users#top`);

				expect(result).toBe(true);
			});
		});
	});
});
