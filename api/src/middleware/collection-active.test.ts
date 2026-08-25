import { CollectionInactiveError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateCollectionActive } from '../permissions/modules/validate-collection-active/validate-collection-active.js';
import collectionActive from './collection-active.js';
import '../types/express.d.ts';

vi.mock('../database/index.js', () => ({
	getDatabase: vi.fn(),
	default: vi.fn().mockReturnValue('knex'),
}));

vi.mock('../permissions/modules/validate-collection-active/validate-collection-active.js');

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

const forwardedError = () => vi.mocked(nextFunction).mock.calls[0]?.[0];

const schema = { collections: { articles: { collection: 'articles' } }, relations: [] } as unknown as Request['schema'];

const accountability = {
	user: 'user-id',
	role: 'role-id',
	admin: false,
	app: true,
	roles: [],
	ip: null,
} as Accountability;

beforeEach(() => {
	mockRequest = { params: {}, method: 'GET', schema };
	mockResponse = {};
	vi.clearAllMocks();
});

describe('pass-through', () => {
	test('Calls next without checking when no collection param is present', async () => {
		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(validateCollectionActive).not.toHaveBeenCalled();
		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeUndefined();
	});

	test('Calls next without checking when the collection param is an empty string', async () => {
		mockRequest.params = { collection: '' };

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(validateCollectionActive).not.toHaveBeenCalled();
		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeUndefined();
	});

	test('Calls next when the check passes', async () => {
		mockRequest.params = { collection: 'articles' };

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalledTimes(1);
		expect(forwardedError()).toBeUndefined();
	});
});

describe('check', () => {
	beforeEach(() => {
		mockRequest.params = { collection: 'archive' };
	});

	test.each([
		['POST', 'create'],
		['PATCH', 'update'],
		['DELETE', 'delete'],
		['GET', 'read'],
		['SEARCH', 'read'],
	])('Checks the %s method as the %s action', async (method, action) => {
		mockRequest.method = method;
		mockRequest.accountability = accountability;

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(validateCollectionActive).toHaveBeenCalledWith(
			{ accountability, collection: 'archive', action },
			{ schema: mockRequest.schema, knex: 'knex' },
		);
	});

	test('Checks without accountability for an unauthenticated request', async () => {
		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(validateCollectionActive).toHaveBeenCalledWith(
			expect.objectContaining({ accountability: null }),
			expect.anything(),
		);
	});

	test('Forwards the error when the check fails', async () => {
		const error = new CollectionInactiveError({ collection: 'archive' });
		vi.mocked(validateCollectionActive).mockRejectedValue(error);

		await collectionActive(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(forwardedError()).toBe(error);
	});
});
