/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('profile', function () {
	test(`read`, async (url, nock) => {
		const scope = nock().get('/users/me').reply(200, {});

		const sdk = new Directus(url);
		await sdk.users.me.read();

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`update`, async (url, nock) => {
		const scope = nock()
			.patch('/users/me', {
				email: 'other@email.com',
				untyped_field: 12345,
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.users.me.update({
			email: 'other@email.com',
			untyped_field: 12345,
		});

		expect(scope.pendingMocks().length).toBe(0);
	});
});
