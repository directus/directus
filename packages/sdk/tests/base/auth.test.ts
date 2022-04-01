/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('auth', function () {
	test(`static auth should validate token`, async (url, nock) => {
		nock()
			.get('/users/me')
			.query({
				access_token: 'token',
			})
			.reply(203);

		const sdk = new Directus(url);
		await sdk.auth.static('token');
	});

	/*
	test(`throws when refresh time resolves to an invalid value`, async (url, nock) => {
		nock()
			.post('/auth/login')
			.reply(200, {
				data: {
					access_token: 'access_token',
					refresh_token: 'refresh_token',
					expires: 10000, // expires in 10 seconds
				},
			});

		const sdk = new Directus(url);
		try {
			await sdk.auth.login(
				{
					email: 'wolfulus@gmail.com',
					password: 'password',
				},
				{
					refresh: {
						auto: true,
						time: 15000, // but we ask to refresh 15 seconds before the expiration
					},
				}
			);
			fail('Should have failed');
		} catch (err: any) {
			expect(err).toBeInstanceOf(InvalidRefreshTime);
		}
	});
	*/

	test(`successful auth should set the token`, async (url, nock) => {
		nock()
			.get('/users/me')
			.query({
				access_token: 'token',
			})
			.reply(203);

		const sdk = new Directus(url);
		await sdk.auth.static('token');

		expect(sdk.auth.token);
	});

	test(`invalid credentials token should not set the token`, async (url, nock) => {
		nock()
			.get('/users/me')
			.reply(401, {
				errors: [
					{
						message: 'Invalid token',
						extensions: {
							code: 'EUNAUTHORIZED',
						},
					},
				],
			});

		const sdk = new Directus(url);
		try {
			await sdk.auth.login({
				email: 'invalid@email.com',
				password: 'invalid_password',
			});
			fail('Should have thrown due to error response');
		} catch {
			//
		}

		expect(sdk.auth.token).toBeNull();
	});

	test(`invalid static token should not set the token`, async (url, nock) => {
		nock()
			.get('/users/me')
			.query({
				access_token: 'token',
			})
			.reply(401, {
				errors: [
					{
						message: 'Invalid token',
						extensions: {
							code: 'EUNAUTHORIZED',
						},
					},
				],
			});

		const sdk = new Directus(url);
		try {
			await sdk.auth.static('token');
			fail('Should have thrown due to error response');
		} catch {
			//
		}

		expect(sdk.auth.token).toBeNull();
	});
});
