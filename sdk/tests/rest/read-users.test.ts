import { describe, expect, test } from 'vitest';
import { readMe, readUser, readUsers } from '../../src/index.js';
import type { TestSchema } from '../schema.js';

describe('readMe', () => {
	test('returns request object', async () => {
		const request = readMe<TestSchema, any>()();

		expect(request.method).toBe('GET');
		expect(request.path).toBe('/users/me');
	});

	test('defaults params to empty object when query is omitted', () => {
		const request = readMe<TestSchema, any>()();

		expect(request.params).toEqual({});
	});
});

describe('readUser', () => {
	test('returns request object with key', async () => {
		const request = readUser<TestSchema, any>('uuid')();

		expect(request.method).toBe('GET');
		expect(request.path).toBe('/users/uuid');
	});

	test('defaults params to empty object when query is omitted', () => {
		const request = readUser<TestSchema, any>('uuid')();

		expect(request.params).toEqual({});
	});

	test('throws when key is empty', () => {
		expect(() => readUser<TestSchema, any>('')()).toThrow('Key cannot be empty');
	});
});

describe('readUsers', () => {
	test('returns request object for users', async () => {
		const request = readUsers<TestSchema, any>()();

		expect(request).toEqual({
			path: '/users',
			params: {},
			method: 'GET',
		});
	});
});
