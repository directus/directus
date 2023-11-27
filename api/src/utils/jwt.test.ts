import jwt from 'jsonwebtoken';
import { expect, test, vi } from 'vitest';
import type { DirectusTokenPayload } from '../types/index.js';
import { verifyAccessJWT, verifyJWT } from './jwt.js';
import { TokenExpiredError, InvalidTokenError } from '@directus/errors';
import { ServiceUnavailableError } from '@directus/errors';

const payload: DirectusTokenPayload = { role: null, app_access: false, admin_access: false };
const secret = 'test-secret';
const options = { issuer: 'directus' };

test('Returns the payload of a correctly signed token', () => {
	const token = jwt.sign(payload, secret, options);
	const result = verifyJWT(token, secret);

	expect(result['admin_access']).toEqual(payload.admin_access);
	expect(result['app_access']).toEqual(payload.app_access);
	expect(result['role']).toEqual(payload.role);
	expect(result['iss']).toBe('directus');
	expect(result['iat']).toBeTypeOf('number');
});

test('Throws TokenExpiredError when token used has expired', () => {
	const token = jwt.sign({ ...payload, exp: new Date().getTime() / 1000 - 500 }, secret, options);
	expect(() => verifyJWT(token, secret)).toThrow(TokenExpiredError);
});

const InvalidTokenCases = {
	'wrong issuer': jwt.sign(payload, secret, { issuer: 'wrong' }),
	'wrong secret': jwt.sign(payload, 'wrong-secret', options),
	'string payload': jwt.sign('illegal payload', secret),
};

Object.entries(InvalidTokenCases).forEach(([title, token]) =>
	test(`Throws InvalidTokenError - ${title}`, () => {
		expect(() => verifyJWT(token, secret)).toThrow(InvalidTokenError);
	}),
);

test(`Throws ServiceUnavailableError for unexpected error from jsonwebtoken`, () => {
	const mock = vi.spyOn(jwt, 'verify').mockImplementation(() => {
		throw new Error();
	});

	const token = jwt.sign(payload, secret, options);
	expect(() => verifyJWT(token, secret)).toThrow(ServiceUnavailableError);
	mock.mockRestore();
});

const RequiredEntries: Array<keyof DirectusTokenPayload> = ['role', 'app_access', 'admin_access'];

RequiredEntries.forEach((entry) => {
	test(`Throws InvalidTokenError if ${entry} not defined`, () => {
		const { [entry]: _entryName, ...rest } = payload;
		const token = jwt.sign(rest, secret, options);
		expect(() => verifyAccessJWT(token, secret)).toThrow(InvalidTokenError);
	});
});

test('Returns the payload of an access token', () => {
	const payload = { id: 1, role: 1, app_access: true, admin_access: true };
	const token = jwt.sign(payload, secret, options);
	const result = verifyAccessJWT(token, secret);

	expect(result).toEqual({
		id: 1,
		role: 1,
		app_access: true,
		admin_access: true,
		share: undefined,
		share_scope: undefined,
	});
});
