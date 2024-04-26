import { useEnv } from '@directus/env';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import extractToken from './extract-token.js';
import { InvalidPayloadError } from '@directus/errors';

vi.mock('@directus/env');

let mockRequest: Request;
let mockResponse: Response;
const next = vi.fn();

beforeEach(() => {
	mockRequest = { query: {}, headers: {}, cookies: {} } as Request;
	mockResponse = {} as Response;

	vi.clearAllMocks();

	vi.mocked(useEnv).mockReturnValue({
		SESSION_COOKIE_NAME: 'session',
	});
});

describe('General', () => {
	test('Null if no token passed', () => {
		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBeNull();
		expect(mockRequest.tokenSource).toBeUndefined();
		expect(next).toBeCalledTimes(1);
	});

	test('Disallow multi auth method', () => {
		mockRequest.query = {
			access_token: 'test',
		};

		mockRequest.headers = {
			authorization: 'Bearer test',
		};

		expect(() => extractToken(mockRequest, mockResponse, next)).toThrowError(InvalidPayloadError);
	});

	test('Allow multi auth method with cookie', () => {
		mockRequest.query = {
			access_token: 'test',
		};

		mockRequest.cookies = {
			authorization: 'Bearer test',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBe('test');
		expect(mockRequest.tokenSource).toBe('query');
		expect(next).toBeCalledTimes(1);
	});
});

describe('Query', () => {
	test('Token from query', () => {
		mockRequest.query = {
			access_token: 'test',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBe('test');
		expect(mockRequest.tokenSource).toBe('query');
		expect(next).toBeCalledTimes(1);
	});

	test('Ignore the token if it is empty', () => {
		mockRequest.query = {
			access_token: '',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBeNull();
		expect(mockRequest.tokenSource).toBeUndefined();
		expect(next).toBeCalledTimes(1);
	});

	test('Ignore the token if query is an array', () => {
		mockRequest.query = {
			access_token: ['test'],
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBeNull();
		expect(mockRequest.tokenSource).toBeUndefined();
		expect(next).toBeCalledTimes(1);
	});
});

describe('Header', () => {
	test('Token from authorization header (capitalized)', () => {
		mockRequest.headers = {
			authorization: 'Bearer test',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBe('test');
		expect(mockRequest.tokenSource).toBe('header');
		expect(next).toBeCalledTimes(1);
	});

	test('Token from authorization header (lowercase)', () => {
		mockRequest.headers = {
			authorization: 'bearer test',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBe('test');
		expect(mockRequest.tokenSource).toBe('header');
		expect(next).toBeCalledTimes(1);
	});

	test('Ignore the token if authorization header contains too few parts', () => {
		mockRequest.headers = {
			authorization: 'bearer',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBeNull();
		expect(mockRequest.tokenSource).toBeUndefined();
		expect(next).toBeCalledTimes(1);
	});

	test('Ignore the token if authorization header contains too many parts', () => {
		mockRequest.headers = {
			authorization: 'bearer test what another one',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBeNull();
		expect(mockRequest.tokenSource).toBeUndefined();
		expect(next).toBeCalledTimes(1);
	});
});

describe('Cookie', () => {
	test('Token from cookie', () => {
		mockRequest.cookies = {
			session: 'test',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBe('test');
		expect(mockRequest.tokenSource).toBe('cookie');
		expect(next).toBeCalledTimes(1);
	});

	test('Ignore the token if the cookie is empty', () => {
		mockRequest.cookies = {
			session: '',
		};

		extractToken(mockRequest, mockResponse, next);

		expect(mockRequest.token).toBeNull();
		expect(mockRequest.tokenSource).toBeUndefined();
		expect(next).toBeCalledTimes(1);
	});
});
