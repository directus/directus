import { CollectionInactiveError, ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateCollectionAccess } from '../permissions/modules/validate-access/lib/validate-collection-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import collectionActive from './collection-active.js';
import '../types/express.d.ts';

vi.mock('../database/index.js', () => ({
	getDatabase: vi.fn(),
	default: vi.fn(),
}));

vi.mock('../permissions/modules/validate-access/lib/validate-collection-access.js');

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

const forwardedError = () => vi.mocked(nextFunction).mock.calls[0]?.[0];

const schema = (inactiveCollections?: string[]) =>
	({
		collections: { articles: { collection: 'articles' } },
		relations: [],
		inactiveCollections,
	}) as unknown as Request['schema'];

const accountability = (overrides: Partial<Accountability> = {}) =>
	({ user: 'user-id', role: 'role-id', admin: false, app: true, roles: [], ip: null, ...overrides }) as Accountability;

beforeEach(() => {
	mockRequest = { params: {}, method: 'GET', schema: schema(['archive']) };
	mockResponse = {};
	vi.clearAllMocks();
	vi.mocked(validateCollectionAccess).mockResolvedValue(false);
});

describe('pass-through', () => {
	test('Calls next when no collection param is present', async () => {
		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeUndefined();
	});

	test('Calls next when the collection param is an empty string', async () => {
		mockRequest.params = { collection: '' };

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeUndefined();
	});

	test('Calls next when the collection is active', async () => {
		mockRequest.params = { collection: 'articles' };

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeUndefined();
	});

	test('Calls next when the schema carries no inactiveCollections', async () => {
		mockRequest.schema = schema();
		mockRequest.params = { collection: 'archive' };

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeUndefined();
	});

	test('Does not check permissions for an active collection', async () => {
		mockRequest.params = { collection: 'articles' };
		mockRequest.accountability = accountability();

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(validateCollectionAccess).not.toHaveBeenCalled();
	});
});

describe('inactive collection', () => {
	beforeEach(() => {
		mockRequest.params = { collection: 'archive' };
	});

	test('Reports inactivity to an admin without checking permissions', async () => {
		mockRequest.accountability = accountability({ admin: true });

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(validateCollectionAccess).not.toHaveBeenCalled();
		expect(forwardedError()).toBeInstanceOf(CollectionInactiveError);
	});

	test('Reports inactivity to a non-admin holding permissions on the collection', async () => {
		mockRequest.accountability = accountability();
		vi.mocked(validateCollectionAccess).mockResolvedValue(true);

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(forwardedError()).toBeInstanceOf(CollectionInactiveError);
	});

	test('Hides inactivity from a non-admin without permissions on the collection', async () => {
		mockRequest.accountability = accountability();
		vi.mocked(validateCollectionAccess).mockResolvedValue(false);

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(forwardedError()).toBeInstanceOf(ForbiddenError);
	});

	test('Hides inactivity from an unauthenticated request without checking permissions', async () => {
		mockRequest.accountability = createDefaultAccountability();

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(validateCollectionAccess).not.toHaveBeenCalled();
		expect(forwardedError()).toBeInstanceOf(ForbiddenError);
	});
});
