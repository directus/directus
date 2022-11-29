import { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { validateQuery } from '../utils/validate-query';
import sanitizeQuery from './sanitize-query';

vi.mock('../utils/validate-query', () => ({
	validateQuery: vi.fn(),
}));

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const query = { fields: ['id'] };

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should return early when there is no query', async () => {
	await sanitizeQuery(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction).not.toHaveBeenCalled();
});

test('should add sanitizedQuery to request object', async () => {
	mockRequest = { query };
	await sanitizeQuery(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.sanitizedQuery).toEqual(query);
});

test('should freeze sanitized query', async () => {
	mockRequest = { query };
	await sanitizeQuery(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(Object.isFrozen(mockRequest.sanitizedQuery)).toBe(true);
});

test('should validate sanitized query', async () => {
	mockRequest = { query };
	await sanitizeQuery(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(vi.mocked(validateQuery)).toHaveBeenCalledWith(query);
});
