import { InvalidPayloadError } from '@directus/errors';
import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import { validateBatch } from './validate-batch.js';
import '../types/express.d.ts';

let mockRequest: Partial<Request & { token?: string }>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
	vi.clearAllMocks();
});

test('Sets body to empty, calls next on GET requests', async () => {
	mockRequest.method = 'GET';

	await validateBatch('read')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockRequest.body).toEqual({});
	expect(nextFunction).toHaveBeenCalledTimes(1);
});

test(`Short circuits on singletons that aren't queried through SEARCH`, async () => {
	mockRequest.method = 'PATCH';
	mockRequest.singleton = true;
	mockRequest.body = { title: 'test' };

	await validateBatch('update')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(nextFunction).toHaveBeenCalledTimes(1);
});

test('Throws InvalidPayloadError on missing body', async () => {
	mockRequest.method = 'SEARCH';

	await validateBatch('read')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(nextFunction).toHaveBeenCalledTimes(1);
	expect(vi.mocked(nextFunction)?.mock?.calls?.[0]?.[0]).toBeInstanceOf(InvalidPayloadError);
});

test(`Short circuits on Array body in update/delete use`, async () => {
	mockRequest.method = 'PATCH';
	mockRequest.body = [1, 2, 3];

	await validateBatch('update')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockRequest.sanitizedQuery).toBe(undefined);
	expect(nextFunction).toHaveBeenCalled();
});

test(`Sets sanitizedQuery based on body.query in read operations`, async () => {
	mockRequest.method = 'SEARCH';

	mockRequest.body = {
		query: {
			sort: 'id',
		},
	};

	await validateBatch('read')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(mockRequest.sanitizedQuery).toEqual({
		sort: ['id'],
	});
});

test(`Doesn't allow both query and keys in a batch delete`, async () => {
	mockRequest.method = 'DELETE';

	mockRequest.body = {
		keys: [1, 2, 3],
		query: { filter: {} },
	};

	await validateBatch('delete')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(nextFunction).toHaveBeenCalledTimes(1);
	expect(vi.mocked(nextFunction)?.mock?.calls?.[0]?.[0]).toBeInstanceOf(InvalidPayloadError);
});

test(`Requires 'data' on batch update`, async () => {
	mockRequest.method = 'PATCH';

	mockRequest.body = {
		keys: [1, 2, 3],
		query: { filter: {} },
	};

	await validateBatch('update')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(nextFunction).toHaveBeenCalledTimes(1);
	expect(vi.mocked(nextFunction)?.mock?.calls?.[0]?.[0]).toBeInstanceOf(InvalidPayloadError);
});

test(`Calls next when all is well`, async () => {
	mockRequest.method = 'PATCH';

	mockRequest.body = {
		query: { filter: {} },
		data: {},
	};

	await validateBatch('update')(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(nextFunction).toHaveBeenCalledTimes(1);
	expect(vi.mocked(nextFunction)?.mock?.calls?.[0]?.[0]).toBeUndefined();
});
