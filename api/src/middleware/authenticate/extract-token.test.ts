import { useEnv } from '@directus/env';
import type { Request } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { extractToken } from './extract-token.js';
import { InvalidPayloadError } from '@directus/errors';

vi.mock('@directus/env');

let mockRequest: Request;

beforeEach(() => {
	mockRequest = { query: {}, headers: {}, cookies: {} } as Request;

	vi.clearAllMocks();

	vi.mocked(useEnv).mockReturnValue({
		SESSION_COOKIE_NAME: 'session',
	});
});

describe('General', () => {
	test('Null if no token in request', () => {
		const result = extractToken(mockRequest);

		expect(result.token).toBeNull();
		expect(result.source).toBeNull();
	});

	test('Disallow multi auth method', () => {
		mockRequest.query = {
			access_token: 'test',
		};

		mockRequest.headers = {
			authorization: 'Bearer test',
		};

		expect(() => extractToken(mockRequest)).toThrowError(InvalidPayloadError);
	});

	test('Allow multi auth method with cookie', () => {
		mockRequest.query = {
			access_token: 'test',
		};

		mockRequest.cookies = {
			authorization: 'Bearer test',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBe('test');
		expect(result.source).toBe('query');
	});
});

describe('Query', () => {
	test('Token from query', () => {
		mockRequest.query = {
			access_token: 'test',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBe('test');
		expect(result.source).toBe('query');
	});

	test('Ignore the token if it is empty', () => {
		mockRequest.query = {
			access_token: '',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBeNull();
		expect(result.source).toBeNull();
	});

	test('Ignore the token if query is an array', () => {
		mockRequest.query = {
			access_token: ['test'],
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBeNull();
		expect(result.source).toBeNull();
	});
});

describe('Header', () => {
	test('Token from authorization header (capitalized)', () => {
		mockRequest.headers = {
			authorization: 'Bearer test',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBe('test');
		expect(result.source).toBe('header');
	});

	test('Token from authorization header (lowercase)', () => {
		mockRequest.headers = {
			authorization: 'bearer test',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBe('test');
		expect(result.source).toBe('header');
	});

	test('Ignore the token if authorization header contains too few parts', () => {
		mockRequest.headers = {
			authorization: 'bearer',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBeNull();
		expect(result.source).toBeNull();
	});

	test('Ignore the token if authorization header contains too many parts', () => {
		mockRequest.headers = {
			authorization: 'bearer test what another one',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBeNull();
		expect(result.source).toBeNull();
	});
});

describe('Cookie', () => {
	test('Token from cookie', () => {
		mockRequest.cookies = {
			session: 'test',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBe('test');
		expect(result.source).toBe('cookie');
	});

	test('Ignore the token if the cookie is empty', () => {
		mockRequest.cookies = {
			session: '',
		};

		const result = extractToken(mockRequest);

		expect(result.token).toBeNull();
		expect(result.source).toBeNull();
	});
});
