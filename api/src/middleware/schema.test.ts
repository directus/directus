import { SchemaOverview } from '@directus/shared/types';
import { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import * as getSchemaUtil from '../utils/get-schema';
import schema from './schema';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const testSchema: SchemaOverview = { collections: {}, relations: [] };

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
	vi.spyOn(getSchemaUtil, 'getSchema').mockResolvedValue(testSchema);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should add schema to request object', async () => {
	// requires await as getSchema() is a promise
	await schema(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.schema).toBe(testSchema);
	expect(nextFunction).toBeCalledTimes(1);
});
