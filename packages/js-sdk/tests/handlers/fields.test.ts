/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('fields', function () {
	test(`update one`, async (url, nock) => {
		const scope = nock()
			.patch('/fields/posts/title', { meta: { required: true } })
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.fields.updateOne('posts', 'title', {
			meta: {
				required: true,
			},
		});

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`check ManyItems return type for readAll`, async (url, nock) => {
		nock()
			.get('/fields')
			.reply(200, { data: [] });

		const sdk = new Directus(url);
		const response = await sdk.fields.readAll();

		expect(Array.isArray(response.data)).toBe(true);
	});

	test(`check ManyItems return type for readMany`, async (url, nock) => {
		nock()
			.get('/fields/posts')
			.reply(200, { data: [] });

		const sdk = new Directus(url);
		const response = await sdk.fields.readMany('posts');
		console.log(response);

		expect(Array.isArray(response.data)).toBe(true);
	});
});
