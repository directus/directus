import type { SchemaOverview } from '@directus/types';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ForbiddenException } from '../exceptions/forbidden.js';
import collectionExists from './collection-exists.js';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const testCollection = 'test';
const testSchema: SchemaOverview = {
	collections: {
		[testCollection]: {
			collection: testCollection,
			primary: 'id',
			singleton: false,
			sortField: null,
			note: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: true,
					type: 'integer',
					dbType: 'integer',
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
			},
		},
	},
	relations: [],
};
const testSystemCollection = 'directus_settings';
const testSystemSchema: SchemaOverview = {
	collections: {
		[testSystemCollection]: {
			collection: testSystemCollection,
			primary: 'id',
			singleton: true,
			sortField: null,
			note: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: true,
					type: 'integer',
					dbType: 'integer',
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
			},
		},
	},
	relations: [],
};

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should not add collection to request object', async () => {
	mockRequest = { params: {} };
	await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.collection).toBe(undefined);
});

test('should pass ForbiddenException error to next() when requested collection does not exist in schema', async () => {
	mockRequest = { params: { collection: testCollection }, schema: { collections: {} } };
	await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(ForbiddenException);
});

test('should add collection to request object with singleton for test collection', async () => {
	mockRequest = { params: { collection: testCollection }, schema: testSchema };
	await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.collection).toBe(testCollection);
	expect(mockRequest.singleton).toBe(testSchema.collections[testCollection].singleton);
});

test('should add collection to request object with singleton for system collection', async () => {
	mockRequest = { params: { collection: testSystemCollection }, schema: testSystemSchema };
	await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.collection).toBe(testSystemCollection);
	expect(mockRequest.singleton).toBe(true);
});
