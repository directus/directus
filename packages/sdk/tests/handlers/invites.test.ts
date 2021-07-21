/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('invites', function () {
	test('send', async (url, nock) => {
		const scope = nock()
			.post('/users/invite', {
				email: 'admin@example.com',
				role: '1e098175-6258-48d6-ad88-d24cae2abe15',
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.users.invites.send('admin@example.com', '1e098175-6258-48d6-ad88-d24cae2abe15');

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`accept`, async (url, nock) => {
		const scope = nock()
			.patch('/users/invite/accept', {
				token: 'token',
				password: 'password1234',
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.users.invites.accept('token', 'password1234');

		expect(scope.pendingMocks().length).toBe(0);
	});
});
