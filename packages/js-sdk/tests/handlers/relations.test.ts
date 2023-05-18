/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('relations', function () {
	test(`update one`, async (url, nock) => {
		const scope = nock()
			.patch('/relations/posts/title', { meta: { required: true } })
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.relations.updateOne('posts', 'title', {
			meta: {
				required: true,
			},
		});

		expect(scope.pendingMocks().length).toBe(0);
	});
});
