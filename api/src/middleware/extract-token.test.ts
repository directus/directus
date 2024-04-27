import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import { extractToken } from './extract-token.js';

let mockRequest: Request;
let mockResponse: Response;
const next = vi.fn();

beforeEach(() => {
	mockRequest = {} as Request;
	mockResponse = {} as Response;
	vi.clearAllMocks();
});

test('Token from query', () => {
	mockRequest.query = {
		access_token: 'test',
	};

	extractToken(mockRequest, mockResponse, next);

	expect(mockRequest.token).toBe('test');
	expect(next).toBeCalledTimes(1);
});

test('Token from Authorization header (capitalized)', () => {
	mockRequest.headers = {
		authorization: 'Bearer test',
	};

	extractToken(mockRequest, mockResponse, next);

	expect(mockRequest.token).toBe('test');
	expect(next).toBeCalledTimes(1);
});

test('Token from Authorization header (lowercase)', () => {
	mockRequest.headers = {
		authorization: 'bearer test',
	};

	extractToken(mockRequest, mockResponse, next);

	expect(mockRequest.token).toBe('test');
	expect(next).toBeCalledTimes(1);
});

test('Ignore the token if authorization header is too many parts', () => {
	mockRequest.headers = {
		authorization: 'bearer test what another one',
	};

	extractToken(mockRequest, mockResponse, next);

	expect(mockRequest.token).toBeNull();
	expect(next).toBeCalledTimes(1);
});

test('Null if no token passed', () => {
	extractToken(mockRequest, mockResponse, next);

	expect(mockRequest.token).toBeNull();
	expect(next).toBeCalledTimes(1);
});
