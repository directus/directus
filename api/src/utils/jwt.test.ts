import { InvalidTokenError, ServiceUnavailableError, TokenExpiredError } from '@directus/errors';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { DirectusTokenPayload } from '../types/index.js';
import { verifyAccessJWT, verifyJWT } from './jwt.js';

const payload: DirectusTokenPayload = { role: null, app_access: false, admin_access: false };
const secret = 'test-secret';
const options = { issuer: 'directus' };

afterEach(() => {
	vi.restoreAllMocks();
});

describe('verifyJWT', () => {
	test('Return the payload of a correctly signed token', () => {
		const token = jwt.sign(payload, secret, options);
		const result = verifyJWT(token, secret);

		expect(result).toStrictEqual({
			role: payload.role,
			admin_access: payload.admin_access,
			app_access: payload.app_access,
			iss: 'directus',
			iat: expect.any(Number),
		});
	});

	test('Throw TokenExpiredError when token used has expired', () => {
		const token = jwt.sign({ ...payload, exp: new Date().getTime() / 1000 - 500 }, secret, options);
		expect(() => verifyJWT(token, secret)).toThrow(TokenExpiredError);
	});

	describe('Throw InvalidTokenError', () => {
		const invalidTokenCases = [
			{ title: 'wrong issuer', token: jwt.sign(payload, secret, { issuer: 'wrong' }) },
			{ title: 'wrong secret', token: jwt.sign(payload, 'wrong-secret', options) },
			{ title: 'string payload', token: jwt.sign('illegal payload', secret) },
		];

		test.each(invalidTokenCases)('$title', ({ token }) => {
			expect(() => verifyJWT(token, secret)).toThrow(InvalidTokenError);
		});
	});

	test(`Throw ServiceUnavailableError for unexpected error from jsonwebtoken`, () => {
		vi.spyOn(jwt, 'verify').mockImplementation(() => {
			throw new Error();
		});

		const token = jwt.sign(payload, secret, options);

		expect(() => verifyJWT(token, secret)).toThrow(ServiceUnavailableError);
	});
});

describe('verifyAccessJWT', () => {
	describe('Throw InvalidTokenError for missing entries', () => {
		const requiredEntries: Array<keyof DirectusTokenPayload> = ['role', 'app_access', 'admin_access'];

		test.each(requiredEntries)('%s', (entry) => {
			const { [entry]: _entryName, ...rest } = payload;
			const token = jwt.sign(rest, secret, options);

			expect(() => verifyAccessJWT(token, secret)).toThrow(InvalidTokenError);
		});
	});

	test('Return the payload of an access token', () => {
		const payload = { id: 1, role: 1, app_access: true, admin_access: true };
		const token = jwt.sign(payload, secret, options);
		const result = verifyAccessJWT(token, secret);

		expect(result).toStrictEqual({
			id: 1,
			role: 1,
			app_access: true,
			admin_access: true,
			iss: 'directus',
			iat: expect.any(Number),
		});
	});
});
