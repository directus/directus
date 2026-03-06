import { useEnv } from '@directus/env';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resolveLoginRedirect } from './resolve-login-redirect.js';

vi.mock('@directus/env');

const PUBLIC_URL = 'https://directus.app';

describe('resolveLoginRedirect', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL,
		});
	});

	describe('empty or invalid redirect', () => {
		test('returns "/" when redirect is undefined', () => {
			expect(resolveLoginRedirect(undefined)).toBe('/');
		});

		test('returns "/" when redirect is empty string', () => {
			expect(resolveLoginRedirect('')).toBe('/');
		});

		test('throws when redirect is not a string', () => {
			expect(() => resolveLoginRedirect(123)).toThrow('"redirect" must be a string');
		});
	});

	describe('relative path redirects', () => {
		test('throws for relative path redirect', () => {
			const result = resolveLoginRedirect('/admin/users');
			expect(result).toBe('/admin/users');
		});

		test('throws for root path redirect', () => {
			const result = resolveLoginRedirect('/');
			expect(result).toBe('/');
		});

		test('throws for protocol-relative URL (//example.com)', () => {
			expect(() => resolveLoginRedirect('//malicious.com/test')).toThrow('Invalid relative URL');
		});
	});

	describe('cross-domain redirects', () => {
		test('allows cross-domain redirect when in REDIRECT_ALLOW_LIST', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'https://api.directus.io',
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://frontend.com/auth/callback',
			});

			const result = resolveLoginRedirect('https://frontend.com/auth/callback', { provider: 'github' });

			expect(result).toBe('https://frontend.com/auth/callback');
		});

		test('rejects cross-domain redirect when NOT in REDIRECT_ALLOW_LIST', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'https://api.directus.io',
			});

			expect(() => resolveLoginRedirect('https://frontend.com/auth/callback', { provider: 'github' })).toThrow(
				'App "redirect" must match PUBLIC_URL',
			);
		});

		test('allows redirect to PUBLIC_URL origin without REDIRECT_ALLOW_LIST', () => {
			const result = resolveLoginRedirect(`${PUBLIC_URL}/admin`, { provider: 'github' });

			expect(result).toBe(`${PUBLIC_URL}/admin`);
		});
	});

	describe('AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST', () => {
		test('allows redirect when in provider-specific allow list', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://example.com/custom',
			});

			const result = resolveLoginRedirect('https://example.com/custom', { provider: 'github' });

			expect(result).toBe('https://example.com/custom');
		});

		test('allows redirect when in provider-specific allow list (array)', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: ['https://example.com/custom1', 'https://example.com/custom2'],
			});

			const result = resolveLoginRedirect('https://example.com/custom2', { provider: 'github' });

			expect(result).toBe('https://example.com/custom2');
		});

		test('falls back to PUBLIC_URL check when not in provider-specific allow list', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://example.com/allowed',
			});

			// Not in allow list, but matches PUBLIC_URL origin
			const result = resolveLoginRedirect(`${PUBLIC_URL}/other-path`, { provider: 'github' });

			expect(result).toBe(`${PUBLIC_URL}/other-path`);
		});

		test('supports deep link URLs for mobile apps', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'myapp://auth/callback',
			});

			const result = resolveLoginRedirect('myapp://auth/callback', { provider: 'github' });

			expect(result).toBe('myapp://auth/callback');
		});
	});

	describe('PUBLIC_URL fallback', () => {
		test('throws when PUBLIC_URL is invalid', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'invalid-url',
			});

			expect(() => resolveLoginRedirect('https://example.com/admin')).toThrow('PUBLIC_URL must be a valid URL');
		});

		test('rejects redirect when not in allow list and not PUBLIC_URL origin', () => {
			expect(() => resolveLoginRedirect('https://different.com/admin')).toThrow('App "redirect" must match PUBLIC_URL');
		});

		test('allows redirect matching PUBLIC_URL origin', () => {
			const result = resolveLoginRedirect(`${PUBLIC_URL}/any/path`);

			expect(result).toBe(`${PUBLIC_URL}/any/path`);
		});
	});

	describe('edge cases', () => {
		test('rejects backslash-escaped forward slash bypass attempt', () => {
			expect(() => resolveLoginRedirect('/\\google.com')).toThrow('Invalid relative URL');
		});

		test('rejects single backslash bypass attempt', () => {
			expect(() => resolveLoginRedirect('\\google.com')).toThrow('Invalid relative URL');
		});

		test('rejects tab character bypass attempt', () => {
			expect(() => resolveLoginRedirect('/\tgoogle.com')).toThrow('Invalid relative URL');
		});

		test('rejects newline character bypass attempt', () => {
			expect(() => resolveLoginRedirect('/\ngoogle.com')).toThrow('Invalid relative URL');
		});

		test('rejects carriage return bypass attempt', () => {
			expect(() => resolveLoginRedirect('/\rgoogle.com')).toThrow('Invalid relative URL');
		});

		test('rejects space after slash bypass attempt', () => {
			expect(() => resolveLoginRedirect('/ google.com')).toThrow('Invalid relative URL');
		});

		test('rejects leading whitespace bypass attempt', () => {
			expect(() => resolveLoginRedirect(' /google.com')).toThrow('Invalid relative URL');
		});

		test('rejects leading tab bypass attempt', () => {
			expect(() => resolveLoginRedirect('\t/google.com')).toThrow('Invalid relative URL');
		});

		test('rejects mixed backslash-forward slash bypass', () => {
			expect(() => resolveLoginRedirect('\\/\\/google.com')).toThrow('Invalid relative URL');
		});

		test('rejects double backslash bypass attempt', () => {
			expect(() => resolveLoginRedirect('\\\\google.com')).toThrow('Invalid relative URL');
		});

		test('rejects backslash with path bypass attempt', () => {
			expect(() => resolveLoginRedirect('\\google.com/callback')).toThrow('Invalid relative URL');
		});

		test('handles URL with query parameters', () => {
			const result = resolveLoginRedirect(`${PUBLIC_URL}/admin?tab=users`);

			expect(result).toBe(`${PUBLIC_URL}/admin?tab=users`);
		});

		test('handles URL with hash fragment', () => {
			const result = resolveLoginRedirect(`${PUBLIC_URL}/admin#section`);

			expect(result).toBe(`${PUBLIC_URL}/admin#section`);
		});

		test('handles URL with both query and hash', () => {
			const result = resolveLoginRedirect(`${PUBLIC_URL}/admin?tab=users#top`);

			expect(result).toBe(`${PUBLIC_URL}/admin?tab=users#top`);
		});

		test('protocol must match (http vs https)', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'https://directus.app',
			});

			expect(() => resolveLoginRedirect('http://directus.app/admin')).toThrow('App "redirect" must match PUBLIC_URL');
		});

		test('port must match when PUBLIC_URL has custom port', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'http://localhost:8055',
			});

			// Different port should be rejected
			expect(() => resolveLoginRedirect('http://localhost:3000/admin')).toThrow('App "redirect" must match PUBLIC_URL');
		});

		test('allows redirect when port matches PUBLIC_URL', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'http://localhost:8055',
			});

			const result = resolveLoginRedirect('http://localhost:8055/admin');

			expect(result).toBe('http://localhost:8055/admin');
		});
	});
});
