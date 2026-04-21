import { describe, expect, test, vi } from 'vitest';
import { resolveBlockedSSORedirect, resolveBlockedSSORedirectFromStateCookie } from './resolve-blocked-sso-redirect.js';

vi.mock('../../utils/get-secret.js', () => ({
	getSecret: vi.fn(() => 'test-secret'),
}));

vi.mock('../../utils/jwt.js', () => ({
	verifyJWT: vi.fn(),
}));

vi.mock('./resolve-login-redirect.js', () => ({
	resolveLoginRedirect: vi.fn(),
}));

describe('resolveBlockedSSORedirect', () => {
	test('returns undefined when no redirect source is provided', async () => {
		await expect(resolveBlockedSSORedirect(undefined, 'test')).toBeUndefined();
	});

	test('returns undefined when redirect validation fails', async () => {
		const { resolveLoginRedirect } = await import('./resolve-login-redirect.js');

		vi.mocked(resolveLoginRedirect).mockImplementation(() => {
			throw new Error('invalid');
		});

		await expect(resolveBlockedSSORedirect('/admin/login', 'test')).toBeUndefined();
	});

	test('returns a validated redirect for direct query or relay state sources', async () => {
		const { resolveLoginRedirect } = await import('./resolve-login-redirect.js');
		vi.mocked(resolveLoginRedirect).mockReturnValue('/admin/login');

		await expect(resolveBlockedSSORedirect('/admin/login', 'test')).toBe('/admin/login');
	});
});

describe('resolveBlockedSSORedirectFromStateCookie', () => {
	test('returns undefined when no cookie is present', async () => {
		await expect(resolveBlockedSSORedirectFromStateCookie(undefined, 'test')).toBeUndefined();
	});

	test('returns undefined when the signed state cookie cannot be verified', async () => {
		const { verifyJWT } = await import('../../utils/jwt.js');

		vi.mocked(verifyJWT).mockImplementation(() => {
			throw new Error('invalid');
		});

		await expect(resolveBlockedSSORedirectFromStateCookie('bad-cookie', 'test')).toBeUndefined();
	});

	test('returns a validated redirect from the signed state cookie', async () => {
		const { verifyJWT } = await import('../../utils/jwt.js');
		const { resolveLoginRedirect } = await import('./resolve-login-redirect.js');

		vi.mocked(verifyJWT).mockReturnValue({ redirect: '/admin/login' } as any);
		vi.mocked(resolveLoginRedirect).mockReturnValue('/admin/login');

		await expect(resolveBlockedSSORedirectFromStateCookie('valid-cookie', 'test')).toBe('/admin/login');
	});
});
