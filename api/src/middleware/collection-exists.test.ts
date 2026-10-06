import { ForbiddenError } from '@directus/errors';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import collectionExists from './collection-exists.js';
import '../types/express.d.ts';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

const forwardedError = () => vi.mocked(nextFunction).mock.calls[0]?.[0] as InstanceType<typeof ForbiddenError>;

const schema = (collections: Record<string, { singleton?: boolean }>) =>
	({
		collections: Object.fromEntries(
			Object.entries(collections).map(([collection, meta]) => [collection, { collection, ...meta }]),
		),
		relations: [],
	}) as unknown as Request['schema'];

beforeEach(() => {
	mockRequest = { params: {}, schema: schema({ articles: {} }) };
	mockResponse = {};
	vi.clearAllMocks();
});

describe('existence gate', () => {
	test('Calls next when no collection param is present', async () => {
		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('Calls next when the collection param is an empty string', async () => {
		mockRequest.params = { collection: '' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('Calls next when the collection exists in the schema', async () => {
		mockRequest.params = { collection: 'articles' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('Forwards a ForbiddenError when the collection is not in the schema', async () => {
		mockRequest.params = { collection: 'unknown' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeInstanceOf(ForbiddenError);
	});

	test('Does not reveal whether an inaccessible collection exists', async () => {
		mockRequest.params = { collection: 'unknown' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(forwardedError().extensions?.reason).toBe(
			`You don't have permission to access collection "unknown" or it does not exist. Queried in root.`,
		);
	});
});

describe('req.collection', () => {
	test('Leaves req.collection unset when the collection is rejected', async () => {
		mockRequest.params = { collection: 'unknown' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockRequest.collection).toBeUndefined();
		expect(mockRequest.singleton).toBeUndefined();
	});

	test('Saves the resolved collection onto the request', async () => {
		mockRequest.params = { collection: 'articles' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockRequest.collection).toBe('articles');
	});
});

describe('req.singleton', () => {
	test('Reads the flag from the schema for a user collection', async () => {
		mockRequest.schema = schema({ articles: { singleton: true } });
		mockRequest.params = { collection: 'articles' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockRequest.singleton).toBe(true);
	});

	test('Is false for a non-singleton user collection', async () => {
		mockRequest.schema = schema({ articles: { singleton: false } });
		mockRequest.params = { collection: 'articles' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockRequest.singleton).toBe(false);
	});

	test('Falls back to false when the schema omits the flag', async () => {
		mockRequest.params = { collection: 'articles' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockRequest.singleton).toBe(false);
	});

	test('Uses the system row for a system singleton', async () => {
		mockRequest.schema = schema({ directus_settings: {} });
		mockRequest.params = { collection: 'directus_settings' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockRequest.singleton).toBe(true);
	});

	test('Uses the system row for a non-singleton system collection', async () => {
		mockRequest.schema = schema({ directus_users: {} });
		mockRequest.params = { collection: 'directus_users' };

		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockRequest.singleton).toBe(false);
	});

	test('Prefers the system row over a conflicting schema flag', async () => {
		mockRequest.schema = schema({ directus_settings: { singleton: false }, directus_users: { singleton: true } });

		mockRequest.params = { collection: 'directus_settings' };
		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);
		expect(mockRequest.singleton).toBe(true);

		mockRequest.params = { collection: 'directus_users' };
		await collectionExists(mockRequest as Request, mockResponse as Response, nextFunction);
		expect(mockRequest.singleton).toBe(false);
	});
});
