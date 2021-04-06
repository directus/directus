/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('tfa', function () {
	test(`enable`, async (url, nock) => {
		const scope = nock()
			.post('/users/me/tfa/enable', {
				password: 'password1234',
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.users.me.tfa.enable('password1234');

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
