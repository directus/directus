import { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import useCollection from './use-collection';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const collection = 'test';

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should add collection to request object', () => {
	const middleware = useCollection(collection);
	middleware(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.collection).toBe(collection);
	expect(nextFunction).toBeCalledTimes(1);
});
