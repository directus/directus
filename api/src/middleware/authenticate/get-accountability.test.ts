import type { Accountability } from '@directus/types';
import type { Request } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { getAccountabilityForToken } from '../../utils/get-accountability-for-token.js';
import { getAccountability } from './get-accountability.js';

vi.mock('../../database/index');
vi.mock('../../utils/get-accountability-for-token');

let mockRequest: Request;

beforeEach(() => {
	mockRequest = {
		ip: '127.0.0.1',
		get: vi.fn((string) => {
			switch (string) {
				case 'user-agent':
					return 'mock-user-agent';
				case 'origin':
					return 'mock-origin';
				default:
					return null;
			}
		}),
	} as unknown as Request;
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Short-circuit when "authenticate" filter is used', async () => {
	const customAccountability = {};

	vi.spyOn(emitter, 'emitFilter').mockResolvedValue(customAccountability);

	const result = await getAccountability(mockRequest, null);

	expect(result).toBe(customAccountability);
});

test('Use default public accountability when no token is given', async () => {
	vi.spyOn(emitter, 'emitFilter').mockImplementation(async (_, payload) => payload);

	const result = await getAccountability(mockRequest, null);

	expect(result).toEqual({
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: '127.0.0.1',
		userAgent: 'mock-user-agent',
		origin: 'mock-origin',
	});
});

test('Get accountability from token if valid token is passed', async () => {
	vi.spyOn(emitter, 'emitFilter').mockImplementation(async (_, payload) => payload);

	const tokenAccountability = {} as Accountability;

	vi.mocked(getAccountabilityForToken).mockResolvedValue(tokenAccountability);

	const token = 'mock-token';

	const result = await getAccountability(mockRequest, token);

	expect(result).toBe(tokenAccountability);
});
