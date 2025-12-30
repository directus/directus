import extractToken from './extract-token.js';
import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import '../types/express.d.ts';

let mockRequest: Partial<Request & { token?: string }>;
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
