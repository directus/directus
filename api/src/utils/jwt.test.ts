import { verifyAccessJWT } from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';
import { InvalidTokenException, ServiceUnavailableException, TokenExpiredException } from '../../src/exceptions';
import { DirectusTokenPayload } from '../../src/types';
import { test, expect, vi } from 'vitest';

const payload: DirectusTokenPayload = { role: null, app_access: false, admin_access: false };
const secret = 'test-secret';
const options = { issuer: 'directus' };

test('Returns the payload of a correctly signed token', () => {
	const token = jwt.sign(payload, secret, options);
	const result = verifyAccessJWT(token, secret);
	expect(result).toEqual(payload);
});

test('Throws TokenExpiredException when token used has expired', () => {
	const token = jwt.sign({ ...payload, exp: new Date().getTime() / 1000 - 500 }, secret, options);
	expect(() => verifyAccessJWT(token, secret)).toThrow(TokenExpiredException);
});

const InvalidTokenCases = {
	'wrong issuer': jwt.sign(payload, secret, { issuer: 'wrong' }),
	'wrong secret': jwt.sign(payload, 'wrong-secret', options),
	'string payload': jwt.sign('illegal payload', secret),
	'missing properties in token payload': jwt.sign({ role: null }, secret, options),
};

Object.entries(InvalidTokenCases).forEach(([title, token]) =>
	test(`Throws InvalidTokenError - ${title}`, () => {
		expect(() => verifyAccessJWT(token, secret)).toThrow(InvalidTokenException);
	})
);

test(`Throws ServiceUnavailableException for unexpected error from jsonwebtoken`, () => {
	vi.spyOn(jwt, 'verify').mockImplementation(() => {
		throw new Error();
	});

	const token = jwt.sign(payload, secret, options);
	expect(() => verifyAccessJWT(token, secret)).toThrow(ServiceUnavailableException);
});
