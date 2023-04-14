import jwt from 'jsonwebtoken';
import { describe, expect, test } from 'vitest';
import { getExpiresAtForToken } from './get-expires-at-for-token.js';

describe('getExpiresAtForToken', () => {
	test('Returns null for non-jwt tokens', () => {
		const result = getExpiresAtForToken('not-a-jwt');
		expect(result).toBe(null);
	});

	test('Returns null for jwt with no exp field', () => {
		const token = jwt.sign({ payload: 'content' }, 'secret', { issuer: 'tim' });
		const result = getExpiresAtForToken(token);
		expect(result).toBe(null);
	});

	test('Returns expiresAt field for jwt with exp as number', () => {
		const now = Math.floor(Date.now() / 1000);
		const token = jwt.sign({ payload: 'content' }, 'secret', { expiresIn: 42 });
		const result = getExpiresAtForToken(token);
		expect(result).toBeGreaterThan(now);
	});
});
