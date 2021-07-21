/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('tfa', function () {
	test(`generate`, async (url, nock) => {
		const scope = nock()
			.post('/users/me/tfa/generate', {
				password: 'password1234',
			})
			.reply(200, {
				data: {
					secret: 'supersecret',
					otpauth_url: 'https://example.com',
				},
			});

		const sdk = new Directus(url);
		const data = await sdk.users.me.tfa.generate('password1234');

		expect(scope.pendingMocks().length).toBe(0);
		expect(data).toStrictEqual({
			secret: 'supersecret',
			otpauth_url: 'https://example.com',
		});
	});
	test(`enable`, async (url, nock) => {
		const scope = nock()
			.post('/users/me/tfa/enable', {
				secret: 'supersecret',
				otp: '123456',
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.users.me.tfa.enable('supersecret', '123456');

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`disable`, async (url, nock) => {
		const scope = nock()
			.post('/users/me/tfa/disable', {
				otp: '12345',
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.users.me.tfa.disable('12345');

		expect(scope.pendingMocks().length).toBe(0);
	});
});
