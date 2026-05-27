import jwt from 'jsonwebtoken';
import { expect, test } from 'vitest';
import isDirectusJWT from './is-directus-jwt.js';

test('Returns false for non JWT string', () => {
	const result = isDirectusJWT('test');
	expect(result).toBe(false);
});

test('Returns false for JWTs with text payload', () => {
	const token = jwt.sign('plaintext', 'secret');
	const result = isDirectusJWT(token);
	expect(result).toBe(false);
});

test(`Returns false if token issuer isn't "directus"`, () => {
	const token = jwt.sign({ payload: 'content' }, 'secret', { issuer: 'rijk' });
	const result = isDirectusJWT(token);
	expect(result).toBe(false);
});

test(`Returns true if token is valid JWT and issuer is "directus"`, () => {
	const token = jwt.sign({ payload: 'content' }, 'secret', { issuer: 'directus' });
	const result = isDirectusJWT(token);
	expect(result).toBe(true);
});
