import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import extractToken from './extract-token.js';
import '../types/express.d.ts';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({ SESSION_COOKIE_NAME: 'directus_session_token' }),
}));

let mockRequest: Partial<Request & { token?: string; tokenSource?: string | null }>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
	vi.clearAllMocks();
});

test('Token from query', () => {
	mockRequest = {
		query: {
			access_token: 'test',
		},
	};

	extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.token).toBe('test');
	expect(nextFunction).toBeCalledTimes(1);
});

test('Token from Authorization header (capitalized)', () => {
	mockRequest = {
		headers: {
			authorization: 'Bearer test',
		},
	};

	extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.token).toBe('test');
	expect(nextFunction).toBeCalledTimes(1);
});

test('Token from Authorization header (lowercase)', () => {
	mockRequest = {
		headers: {
			authorization: 'bearer test',
		},
	};

	extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.token).toBe('test');
	expect(nextFunction).toBeCalledTimes(1);
});

test('Ignore the token if authorization header is too many parts', () => {
	mockRequest = {
		headers: {
			authorization: 'bearer test what another one',
		},
	};

	extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.token).toBeNull();
	expect(nextFunction).toBeCalledTimes(1);
});

test('Null if no token passed', () => {
	extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.token).toBeNull();
	expect(nextFunction).toBeCalledTimes(1);
});

describe('tokenSource', () => {
	test('is "query" when access_token in query string', () => {
		mockRequest = { query: { access_token: 'test' } };
		extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
		expect(mockRequest.tokenSource).toBe('query');
	});

	test('is "header" when Authorization: Bearer present', () => {
		mockRequest = { headers: { authorization: 'Bearer test' } };
		extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
		expect(mockRequest.tokenSource).toBe('header');
	});

	test('is "cookie" when session cookie present and no header/query', () => {
		mockRequest = { cookies: { directus_session_token: 'test' } };
		extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
		expect(mockRequest.tokenSource).toBe('cookie');
	});

	test('is null when no token present', () => {
		mockRequest = {};
		extractToken(mockRequest as Request, mockResponse as Response, nextFunction);
		expect(mockRequest.tokenSource).toBeNull();
	});

	test('RFC6750 multi-method rejection still works (query + header)', () => {
		mockRequest = {
			query: { access_token: 'test' },
			headers: { authorization: 'Bearer test' },
		};

		expect(() => extractToken(mockRequest as Request, mockResponse as Response, nextFunction)).toThrow();
	});
});
