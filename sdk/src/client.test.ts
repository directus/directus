import { assertType, expectTypeOf, describe, test, expect } from 'vitest';
import { createDirectus } from './client.js';
import {
	staticToken,
	type DirectusClient,
	type StaticTokenClient,
	authentication,
	type AuthenticationClient,
	rest,
	type RestClient,
} from './index.js';

describe('test client composability', () => {
	test('basic client', async () => {
		const client = createDirectus<any>('http://localhost:8055');
		expectTypeOf(client).toHaveProperty('with');

		assertType<DirectusClient<any>>(client);
	});

	test('static token', async () => {
		const client = createDirectus<any>('http://localhost:8055').with(staticToken('test'));

		expectTypeOf(client).toHaveProperty('getToken');
		expectTypeOf(client).toHaveProperty('setToken');
		expect(await client.getToken()).toBe('test');

		client.setToken('test2');
		expect(await client.getToken()).toBe('test2');

		assertType<DirectusClient<any> & StaticTokenClient<any>>(client);
	});

	test('authentication', async () => {
		const client = createDirectus<any>('http://localhost:8055').with(authentication('json', { autoRefresh: false }));

		expectTypeOf(client).toHaveProperty('getToken');
		expectTypeOf(client).toHaveProperty('setToken');

		client.setToken('test');
		expect(await client.getToken()).toBe('test');

		expectTypeOf(client).toHaveProperty('refresh');
		expectTypeOf(client).toHaveProperty('login');
		expectTypeOf(client).toHaveProperty('logout');

		assertType<DirectusClient<any> & AuthenticationClient<any>>(client);
	});

	test('rest', async () => {
		const client = createDirectus<any>('http://localhost:8055').with(rest());

		expectTypeOf(client).toHaveProperty('request');
		assertType<DirectusClient<any> & RestClient<any>>(client);
	});

	test('auth + rest', async () => {
		const client = createDirectus<any>('http://localhost:8055')
			.with(authentication('json', { autoRefresh: false }))
			.with(rest());

		expectTypeOf(client).toHaveProperty('refresh');
		expectTypeOf(client).toHaveProperty('login');
		expectTypeOf(client).toHaveProperty('logout');
		expectTypeOf(client).toHaveProperty('getToken');
		expectTypeOf(client).toHaveProperty('setToken');
		expectTypeOf(client).toHaveProperty('request');

		assertType<DirectusClient<any> & AuthenticationClient<any> & RestClient<any>>(client);
	});
});
