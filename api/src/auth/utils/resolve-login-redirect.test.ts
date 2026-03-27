import { useEnv } from '@directus/env';
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { resolveLoginRedirect } from './resolve-login-redirect.js';

vi.mock('@directus/env');

const PUBLIC_URL = 'https://directus.app';

const FALSY_INPUTS = [{ input: undefined }, { input: '' }, { input: null }, { input: false }, { input: 0 }];

const INVALID_TYPE_INPUTS = [{ input: 123 }, { input: { url: '/admin' } }, { input: ['/admin'] }];

const VALID_RELATIVE_PATHS = [
	{ input: '/', expected: '/' },
	{ input: '/admin/users', expected: '/admin/users' },
	{ input: '/a/b/c/d/e', expected: '/a/b/c/d/e' },
	{ input: '/admin?tab=users', expected: '/admin?tab=users' },
	{ input: '/admin#section', expected: '/admin#section' },
	{ input: '/admin?tab=users#top', expected: '/admin?tab=users#top' },
	{ input: '#fragment', expected: '/#fragment' },
	{ input: '?foo=bar', expected: '/?foo=bar' },
];

const NORMALIZATION_CASES = [
	{ input: './admin', expected: '/admin' },
	{ input: '../admin', expected: '/admin' },
	{ input: '\\google.com', expected: '/google.com' },
	{ input: '\\google.com/callback', expected: '/google.com/callback' },
	{ input: '/\tgoogle.com', expected: '/google.com' },
	{ input: '/\ngoogle.com', expected: '/google.com' },
	{ input: '/\rgoogle.com', expected: '/google.com' },
	{ input: '/ google.com', expected: '/%20google.com' },
	{ input: ' /google.com', expected: '/google.com' },
	{ input: '\t/google.com', expected: '/google.com' },
];

const RELATIVE_BYPASS_ATTEMPTS = [
	{ input: '//malicious.com/test' },
	{ input: '/\\google.com' },
	{ input: '\\\\google.com' },
	{ input: '\\/\\/google.com' },
	{ input: '//\\evil.com' },
];

const SAFE_ENCODED_PATHS = [
	{ input: '%2F%2Fevil.com', expected: '/%2F%2Fevil.com' },
	{ input: '/admin%00.evil.com', expected: '/admin%00.evil.com' },
];

const DISALLOWED_PROTOCOLS = [
	{ input: 'javascript:alert(1)' },
	{ input: 'data:text/html,<script>alert(1)</script>' },
	{ input: 'ftp://files.example.com/data' },
];

const VALID_PUBLIC_URL_REDIRECTS = [
	{ input: `${PUBLIC_URL}/admin` },
	{ input: `${PUBLIC_URL}/` },
	{ input: `${PUBLIC_URL}/admin?tab=users` },
	{ input: `${PUBLIC_URL}/admin#section` },
	{ input: `${PUBLIC_URL}/admin?tab=users#top` },
];

const AUTHORITY_BYPASS_ATTEMPTS = [
	{ input: 'https://directus.app@evil.com' },
	{ input: 'https://user:pass@evil.com/admin' },
	{ input: 'https://directus.app.evil.com/admin' },
	{ input: 'HTTPS://evil.com/admin' },
];

const SUB_PATH_URL = 'https://directus.app/subpath';

const VALID_SUB_PATH_REDIRECTS = [
	{ input: `${SUB_PATH_URL}/admin` },
	{ input: `${SUB_PATH_URL}/` },
	{ input: SUB_PATH_URL },
	{ input: `${SUB_PATH_URL}/admin?tab=users#top` },
	{ input: 'https://directus.app/other' },
];

const ALLOW_LIST_EXTRA_PARAMS = [
	{ input: 'https://frontend.com/callback?token=stolen' },
	{ input: 'https://frontend.com/callback#evil' },
];

describe('resolveLoginRedirect', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL,
		});
	});

	describe('input validation', () => {
		test.each(FALSY_INPUTS)('returns "/" when redirect is $input', ({ input }) => {
			expect(resolveLoginRedirect(input)).toBe('/');
		});

		test.each(INVALID_TYPE_INPUTS)('throws when redirect is $input', ({ input }) => {
			expect(() => resolveLoginRedirect(input)).toThrow('"redirect" must be a string');
		});

		test('throws when PUBLIC_URL is missing', () => {
			vi.mocked(useEnv).mockReturnValue({});

			expect(() => resolveLoginRedirect('/admin')).toThrow('"PUBLIC_URL" must be defined');
		});

		test('throws when PUBLIC_URL is empty string', () => {
			vi.mocked(useEnv).mockReturnValue({ PUBLIC_URL: '' });

			expect(() => resolveLoginRedirect('/admin')).toThrow('"PUBLIC_URL" must be defined');
		});

		test('throws when PUBLIC_URL is invalid', () => {
			vi.mocked(useEnv).mockReturnValue({ PUBLIC_URL: 'invalid-url' });

			expect(() => resolveLoginRedirect('https://example.com/admin')).toThrow('PUBLIC_URL must be a valid URL');
		});
	});

	describe('relative paths', () => {
		test.each(VALID_RELATIVE_PATHS)('resolves "$input" to "$expected"', ({ input, expected }) => {
			expect(resolveLoginRedirect(input)).toBe(expected);
		});

		describe('normalization', () => {
			test.each(NORMALIZATION_CASES)('normalizes "$input" to "$expected"', ({ input, expected }) => {
				expect(resolveLoginRedirect(input)).toBe(expected);
			});
		});

		describe('bypass attempts', () => {
			test.each(RELATIVE_BYPASS_ATTEMPTS)('rejects "$input"', ({ input }) => {
				expect(() => resolveLoginRedirect(input)).toThrow('Invalid relative URL');
			});

			test.each(SAFE_ENCODED_PATHS)('treats "$input" as safe relative path', ({ input, expected }) => {
				expect(resolveLoginRedirect(input)).toBe(expected);
			});
		});
	});

	describe('absolute URLs', () => {
		describe('disallowed protocols', () => {
			test.each(DISALLOWED_PROTOCOLS)('rejects "$input"', ({ input }) => {
				expect(() => resolveLoginRedirect(input)).toThrow('Only http/https redirect protocols are allowed');
			});

			test('rejects non-http/https deep link even when in allow list', () => {
				vi.mocked(useEnv).mockReturnValue({
					PUBLIC_URL,
					AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'myapp://auth/callback',
				});

				expect(() => resolveLoginRedirect('myapp://auth/callback', { provider: 'github' })).toThrow(
					'Only http/https redirect protocols are allowed',
				);
			});
		});

		describe('matching PUBLIC_URL', () => {
			test.each(VALID_PUBLIC_URL_REDIRECTS)('allows "$input"', ({ input }) => {
				expect(resolveLoginRedirect(input)).toBe(input);
			});

			test('allows matching custom port', () => {
				vi.mocked(useEnv).mockReturnValue({ PUBLIC_URL: 'http://localhost:8055' });

				expect(resolveLoginRedirect('http://localhost:8055/admin')).toBe('http://localhost:8055/admin');
			});

			test('works with provider option when no allow list configured', () => {
				expect(resolveLoginRedirect(`${PUBLIC_URL}/admin`, { provider: 'github' })).toBe(`${PUBLIC_URL}/admin`);
			});
		});

		describe('not matching PUBLIC_URL', () => {
			test('rejects different domain', () => {
				expect(() => resolveLoginRedirect('https://evil.com/admin')).toThrow('App "redirect" must match PUBLIC_URL');
			});

			test('rejects different protocol (http vs https)', () => {
				expect(() => resolveLoginRedirect('http://directus.app/admin')).toThrow('App "redirect" must match PUBLIC_URL');
			});

			test('rejects different port', () => {
				vi.mocked(useEnv).mockReturnValue({ PUBLIC_URL: 'http://localhost:8055' });

				expect(() => resolveLoginRedirect('http://localhost:3000/admin')).toThrow(
					'App "redirect" must match PUBLIC_URL',
				);
			});
		});

		describe('credential/authority bypass attempts', () => {
			test.each(AUTHORITY_BYPASS_ATTEMPTS)('rejects "$input"', ({ input }) => {
				expect(() => resolveLoginRedirect(input)).toThrow('App "redirect" must match PUBLIC_URL');
			});
		});

		describe('PUBLIC_URL with sub path', () => {
			beforeEach(() => {
				vi.mocked(useEnv).mockReturnValue({ PUBLIC_URL: SUB_PATH_URL });
			});

			test.each(VALID_SUB_PATH_REDIRECTS)('allows "$input"', ({ input }) => {
				expect(resolveLoginRedirect(input)).toBe(input);
			});

			test('rejects different domain', () => {
				expect(() => resolveLoginRedirect('https://evil.com/subpath/admin')).toThrow(
					'App "redirect" must match PUBLIC_URL',
				);
			});

			test('rejects different protocol', () => {
				expect(() => resolveLoginRedirect('http://directus.app/subpath/admin')).toThrow(
					'App "redirect" must match PUBLIC_URL',
				);
			});
		});
	});

	describe('provider redirect allow list', () => {
		test('allows cross-domain redirect when in allow list', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL: 'https://api.directus.io',
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://frontend.com/auth/callback',
			});

			expect(resolveLoginRedirect('https://frontend.com/auth/callback', { provider: 'github' })).toBe(
				'https://frontend.com/auth/callback',
			);
		});

		test('allows redirect from array allow list', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: ['https://example.com/one', 'https://example.com/two'],
			});

			expect(resolveLoginRedirect('https://example.com/two', { provider: 'github' })).toBe('https://example.com/two');
		});

		test('implicitly allows PUBLIC_URL when allow list is configured', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://other.com/callback',
			});

			expect(resolveLoginRedirect(`${PUBLIC_URL}/admin`, { provider: 'github' })).toBe(`${PUBLIC_URL}/admin`);
		});

		test('rejects URL not in allow list and not matching PUBLIC_URL', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://allowed.com/callback',
			});

			expect(() => resolveLoginRedirect('https://evil.com/steal', { provider: 'github' })).toThrow(
				'App "redirect" must match PUBLIC_URL',
			);
		});

		test('rejects cross-domain redirect when no allow list configured', () => {
			expect(() => resolveLoginRedirect('https://frontend.com/callback', { provider: 'github' })).toThrow(
				'App "redirect" must match PUBLIC_URL',
			);
		});

		test.each(ALLOW_LIST_EXTRA_PARAMS)('allows allow-listed URL with extra params "$input"', ({ input }) => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://frontend.com/callback',
			});

			expect(resolveLoginRedirect(input, { provider: 'github' })).toBe(input);
		});

		test('rejects allow-listed URL with different path', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://frontend.com/callback',
			});

			expect(() => resolveLoginRedirect('https://frontend.com/other', { provider: 'github' })).toThrow(
				'App "redirect" must match PUBLIC_URL',
			);
		});

		test('rejects @-based authority confusion even when allow list configured', () => {
			vi.mocked(useEnv).mockReturnValue({
				PUBLIC_URL,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://frontend.com/callback',
			});

			expect(() => resolveLoginRedirect('https://frontend.com@evil.com/callback', { provider: 'github' })).toThrow(
				'App "redirect" must match PUBLIC_URL',
			);
		});

		describe('with sub path PUBLIC_URL', () => {
			test('allows allow-listed redirect', () => {
				vi.mocked(useEnv).mockReturnValue({
					PUBLIC_URL: 'https://directus.app/subpath',
					AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://frontend.com/callback',
				});

				expect(resolveLoginRedirect('https://frontend.com/callback', { provider: 'github' })).toBe(
					'https://frontend.com/callback',
				);
			});

			test('implicitly allows PUBLIC_URL with sub path', () => {
				vi.mocked(useEnv).mockReturnValue({
					PUBLIC_URL: 'https://directus.app/subpath',
					AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'https://other.com/callback',
				});

				expect(resolveLoginRedirect('https://directus.app/subpath', { provider: 'github' })).toBe(
					'https://directus.app/subpath',
				);
			});
		});
	});
});
