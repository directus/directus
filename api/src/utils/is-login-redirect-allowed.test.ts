import { useEnv } from '@directus/env';
import type { Logger } from 'pino';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useLogger } from '../logger/index.js';
import { isLoginRedirectAllowed } from './is-login-redirect-allowed.js';

vi.mock('@directus/env');
vi.mock('../logger');

let mockLogger: Logger;

beforeEach(() => {
	mockLogger = {
		error: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('isLoginRedirectAllowed returns true with no redirect', () => {
	const redirect = undefined;
	const provider = 'local';

	expect(isLoginRedirectAllowed(redirect, provider)).toBe(true);
});

test('isLoginRedirectAllowed returns false with invalid redirect', () => {
	const redirect = 123456;
	const provider = 'local';

	expect(isLoginRedirectAllowed(redirect, provider)).toBe(false);
});

test('isLoginRedirectAllowed returns true for allowed URL', () => {
	const provider = 'local';

	vi.mocked(useEnv).mockReturnValue({
		[`AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`]:
			'http://external.example.com,https://external.example.com,http://external.example.com:8055/test',
		PUBLIC_URL: 'http://public.example.com',
	});

	expect(isLoginRedirectAllowed('http://public.example.com', provider)).toBe(true);
	expect(isLoginRedirectAllowed('http://external.example.com', provider)).toBe(true);
	expect(isLoginRedirectAllowed('https://external.example.com', provider)).toBe(true);
	expect(isLoginRedirectAllowed('http://external.example.com:8055/test', provider)).toBe(true);
});

test('isLoginRedirectAllowed returns false for denied URL', () => {
	const provider = 'local';

	vi.mocked(useEnv).mockReturnValue({
		[`AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`]: 'http://external.example.com',
		PUBLIC_URL: 'http://public.example.com',
	});

	expect(isLoginRedirectAllowed('https://external.example.com', provider)).toBe(false);
	expect(isLoginRedirectAllowed('http://external.example.com:8055', provider)).toBe(false);
	expect(isLoginRedirectAllowed('http://external.example.com/test', provider)).toBe(false);
});

test('isLoginRedirectAllowed returns true for relative paths', () => {
	const provider = 'local';

	vi.mocked(useEnv).mockReturnValue({
		[`AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`]: 'http://external.example.com',
		PUBLIC_URL: 'http://public.example.com',
	});

	expect(isLoginRedirectAllowed('/admin/content', provider)).toBe(true);
	expect(isLoginRedirectAllowed('../admin/content', provider)).toBe(true);
	expect(isLoginRedirectAllowed('./admin/content', provider)).toBe(true);

	expect(isLoginRedirectAllowed('http://public.example.com/admin/content', provider)).toBe(true);
});

test('isLoginRedirectAllowed returns false if missing protocol', () => {
	const provider = 'local';

	vi.mocked(useEnv).mockReturnValue({
		[`AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`]: 'http://example.com',
		PUBLIC_URL: 'http://example.com',
	});

	expect(isLoginRedirectAllowed('//example.com/admin/content', provider)).toBe(false);
	expect(isLoginRedirectAllowed('//user@password:example.com/', provider)).toBe(false);
});

test('isLoginRedirectAllowed throws error if PUBLIC_URL is misconfigured', () => {
	const provider = 'local';

	vi.mocked(useEnv).mockReturnValue({
		PUBLIC_URL: '/',
	});

	expect(isLoginRedirectAllowed('http://public.example.com', provider)).toBe(false);
	expect(mockLogger.error).toHaveBeenCalledWith('Invalid PUBLIC_URL for login redirect');
});
