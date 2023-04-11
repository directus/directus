import type { Permission } from '@directus/types';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getPermissions as getPermissionsUtil } from '../utils/get-permissions.js';
import getPermissions from './get-permissions.js';

vi.mock('../utils/get-permissions', () => ({
	getPermissions: vi.fn(),
}));

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

const accountability = { role: '00000000-0000-0000-0000-000000000000' };

const mockPermissions = [
	{
		id: 1,
		role: null,
		collection: 'products',
		action: 'read',
		permissions: {},
		validation: {},
		presets: {},
		fields: ['*'],
	},
] as Permission[];

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should pass Error to next() when using unauthenticated request (no accountability)', async () => {
	await getPermissions(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(Error);
	expect(nextFunction.mock.calls[0][0].message).toBe('getPermissions middleware needs to be called after authenticate');
});

test('should add permissions to req.accountability.permissions', async () => {
	vi.mocked(getPermissionsUtil).mockResolvedValue(mockPermissions);

	mockRequest = { accountability };
	await getPermissions(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockRequest.accountability?.permissions).toEqual(mockPermissions);
});
