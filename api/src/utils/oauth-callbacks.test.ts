import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Request } from 'express';
import type { Logger } from 'pino';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../logger/index.js';
import { generateRedirectUrls, getCallbackFromOriginUrl, getCallbackFromRequest } from './oauth-callbacks.js';

vi.mock('@directus/env');
vi.mock('../logger');

let mockLogger: Logger;

beforeEach(() => {
	mockLogger = {
		warn: vi.fn(),
		debug: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getCallbackFromOriginUrl', () => {
	test('returns first callback when originUrl is undefined (legacy fallback)', () => {
		const redirectUris = [
			new URL('http://localhost:8080/auth/login/github/callback'),
			new URL('http://external.com/auth/login/github/callback'),
		];

		const result = getCallbackFromOriginUrl(redirectUris, undefined);

		expect(result).toBe(redirectUris[0]);
	});

	test('returns matching callback when originUrl is found', () => {
		const redirectUris = [
			new URL('http://localhost:8080/auth/login/github/callback'),
			new URL('http://external.com/auth/login/github/callback'),
		];

		const result = getCallbackFromOriginUrl(redirectUris, 'http://external.com');

		expect(result).toBe(redirectUris[1]);
	});

	test('throws ForbiddenError when originUrl is not found', () => {
		const redirectUris = [new URL('http://localhost:8080/auth/login/github/callback')];

		expect(() => {
			getCallbackFromOriginUrl(redirectUris, 'http://fail.com');
		}).toThrow(ForbiddenError);
	});
});

describe('getCallbackFromRequest', () => {
	test('uses Host header when IP_TRUST_PROXY is false', () => {
		vi.mocked(useEnv).mockReturnValue({
			IP_TRUST_PROXY: false,
		});

		const req = {
			get: vi.fn((header: string) => {
				if (header === 'host') return 'localhost:8080';
				return undefined;
			}),
			protocol: 'http',
		} as unknown as Request;

		const redirectUris = [new URL('http://localhost:8080/auth/login/github/callback')];

		const result = getCallbackFromRequest(req, redirectUris, 'OAuth2');

		expect(result).toBe(redirectUris[0]);
		expect(req.get).toHaveBeenCalledWith('host');
	});

	test('uses X-Forwarded-Host and X-Forwarded-Proto when IP_TRUST_PROXY is true', () => {
		vi.mocked(useEnv).mockReturnValue({
			IP_TRUST_PROXY: true,
		});

		const req = {
			get: vi.fn((header: string) => {
				if (header === 'x-forwarded-host') return 'external.com:443';
				if (header === 'x-forwarded-proto') return 'https';
				return undefined;
			}),
			protocol: 'http',
		} as unknown as Request;

		const redirectUris = [new URL('https://external.com/auth/login/github/callback')];

		const result = getCallbackFromRequest(req, redirectUris, 'OAuth2');

		expect(result).toBe(redirectUris[0]);
		expect(req.get).toHaveBeenCalledWith('x-forwarded-host');
		expect(req.get).toHaveBeenCalledWith('x-forwarded-proto');
	});

	test('falls back to Host when X-Forwarded-Host is not present', () => {
		vi.mocked(useEnv).mockReturnValue({
			IP_TRUST_PROXY: true,
		});

		const req = {
			get: vi.fn((header: string) => {
				if (header === 'host') return 'localhost:8080';
				return undefined;
			}),
			protocol: 'http',
		} as unknown as Request;

		const redirectUris = [new URL('http://localhost:8080/auth/login/github/callback')];

		const result = getCallbackFromRequest(req, redirectUris, 'OAuth2');

		expect(result?.href).toBe('http://localhost:8080/auth/login/github/callback');
		expect(req.get).toHaveBeenCalledWith('host');
	});

	test('throws InvalidPayloadError when origin URL is invalid', () => {
		vi.mocked(useEnv).mockReturnValue({
			IP_TRUST_PROXY: false,
		});

		const req = {
			get: vi.fn(() => 'not a valid host'),
			protocol: 'http',
		} as unknown as Request;

		const redirectUris = [new URL('http://localhost:8080/auth/login/github/callback')];

		expect(() => {
			getCallbackFromRequest(req, redirectUris, 'OAuth2');
		}).toThrow(InvalidPayloadError);
	});

	test('throws ForbiddenError when origin is not in redirectUris', () => {
		vi.mocked(useEnv).mockReturnValue({
			IP_TRUST_PROXY: false,
		});

		const req = {
			get: vi.fn(() => 'fail.com'),
			protocol: 'http',
		} as unknown as Request;

		const redirectUris = [new URL('http://localhost:8080/auth/login/github/callback')];

		expect(() => {
			getCallbackFromRequest(req, redirectUris, 'OAuth2');
		}).toThrow(ForbiddenError);
	});
});

describe('generateRedirectUrls', () => {
	test('returns empty array when REDIRECT_ALLOW_LIST is not set', () => {
		vi.mocked(useEnv).mockReturnValue({});

		const result = generateRedirectUrls('github', 'OAuth2');

		expect(result).toEqual([]);
	});

	test('includes URLs from REDIRECT_ALLOW_LIST', () => {
		vi.mocked(useEnv).mockReturnValue({
			AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'http://external.com/admin/login,https://external2.com/admin/content',
		});

		const result = generateRedirectUrls('github', 'OAuth2');

		expect(result).toHaveLength(2);
		expect(result[0]?.href).toBe('http://external.com/auth/login/github/callback');
		expect(result[1]?.href).toBe('https://external2.com/auth/login/github/callback');
	});

	test('skips invalid domains and logs warning', () => {
		vi.mocked(useEnv).mockReturnValue({
			AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'http://valid.com,not-a-url,http://valid2.com',
		});

		const result = generateRedirectUrls('github', 'OAuth2');

		expect(result).toHaveLength(2);
		expect(result[0]?.href).toBe('http://valid.com/auth/login/github/callback');
		expect(result[1]?.href).toBe('http://valid2.com/auth/login/github/callback');

		expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('[OAuth2] Invalid domain'));
	});

	test('deduplicates URLs with same origin', () => {
		vi.mocked(useEnv).mockReturnValue({
			AUTH_GITHUB_REDIRECT_ALLOW_LIST: 'http://example.com/admin/login,http://example.com/admin/content',
		});

		const result = generateRedirectUrls('github', 'OAuth2');

		expect(result).toHaveLength(1);
		expect(result[0]?.href).toBe('http://example.com/auth/login/github/callback');
	});

	test('returns empty array when REDIRECT_ALLOW_LIST key does not exist', () => {
		vi.mocked(useEnv).mockReturnValue({
			AUTH_GOOGLE_REDIRECT_ALLOW_LIST: 'http://example.com',
		});

		const result = generateRedirectUrls('github', 'OAuth2');

		expect(result).toEqual([]);
	});
});
