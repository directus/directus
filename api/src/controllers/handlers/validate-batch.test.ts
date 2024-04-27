import { InvalidPayloadError } from '@directus/errors';
import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import { validateBatch } from './validate-batch.js';

let mockRequest: Request;
let mockResponse: Response;
const next = vi.fn();

beforeEach(() => {
	mockRequest = {} as Request;
	mockResponse = {} as Response;
	vi.clearAllMocks();
});

test('Sets body to empty, calls next on GET requests', () => {
	mockRequest.method = 'GET';

	validateBatch('read')(mockRequest, mockResponse, next);

	expect(mockRequest.body).toEqual({});
	expect(next).toHaveBeenCalledTimes(1);
});

test(`Short circuits on singletons that aren't queried through SEARCH`, () => {
	mockRequest.method = 'PATCH';
	mockRequest.singleton = true;
	mockRequest.body = { title: 'test' };

	validateBatch('update')(mockRequest, mockResponse, next);

	expect(next).toHaveBeenCalledTimes(1);
});

test('Throws InvalidPayloadError on missing body', () => {
	mockRequest.method = 'SEARCH';

	expect(() => validateBatch('read')(mockRequest, mockResponse, next)).toThrowError(InvalidPayloadError);
});

test(`Short circuits on Array body in update/delete use`, () => {
	mockRequest.method = 'PATCH';
	mockRequest.body = [1, 2, 3];

	validateBatch('update')(mockRequest, mockResponse, next);

	expect(mockRequest.sanitizedQuery).toBe(undefined);
	expect(next).toHaveBeenCalled();
});

test(`Sets sanitizedQuery based on body.query in read operations`, () => {
	mockRequest.method = 'SEARCH';

	mockRequest.body = {
		query: {
			sort: 'id',
		},
	};

	validateBatch('read')(mockRequest, mockResponse, next);

	expect(mockRequest.sanitizedQuery).toEqual({
		sort: ['id'],
	});
});

test(`Doesn't allow both query and keys in a batch delete`, () => {
	mockRequest.method = 'DELETE';

	mockRequest.body = {
		keys: [1, 2, 3],
		query: { filter: {} },
	};

	expect(() => validateBatch('delete')(mockRequest, mockResponse, next)).toThrowError(InvalidPayloadError);
});

test(`Requires 'data' on batch update`, () => {
	mockRequest.method = 'PATCH';

	mockRequest.body = {
		keys: [1, 2, 3],
		query: { filter: {} },
	};

	expect(() => validateBatch('update')(mockRequest, mockResponse, next)).toThrowError(InvalidPayloadError);
});

test(`Calls next when all is well`, () => {
	mockRequest.method = 'PATCH';

	mockRequest.body = {
		query: { filter: {} },
		data: {},
	};

	validateBatch('update')(mockRequest, mockResponse, next);

	expect(next).toHaveBeenCalledTimes(1);
	expect(vi.mocked(next).mock.calls[0][0]).toBeUndefined();
});
