/**
 * @jest-environment node
 */

import argon2 from 'argon2';
import { Directus } from '../../src';
import { test } from '../utils';
import { generateHash } from '../utils';

describe('utils', function () {
	test(`generates random string`, async (url, nock) => {
		nock()
			.get('/utils/random/string')
			.query({
				length: '32',
			})
			.reply(200, {
				data: '01234567890123456789012345678901',
			});

		const sdk = new Directus(url);
		const str = await sdk.utils.random.string(32);

		expect(str).toBe('01234567890123456789012345678901');
	});

	test(`hash generate`, async (url, nock) => {
		nock()
			.post('/utils/hash/generate', {
				string: 'wolfulus',
			})
			.reply(200, async (_, body: any) => {
				return {
					data: await generateHash(body.string),
				};
			});

		const sdk = new Directus(url);
		const hash = await sdk.utils.hash.generate('wolfulus');

		expect(hash?.substr(0, 7)).toBe('$argon2');
	});

	test(`hash verify`, async (url, nock) => {
		nock()
			.post('/utils/hash/generate', {
				string: 'wolfulus',
			})
			.reply(200, async (_, body: any) => {
				return {
					data: await generateHash(body.string),
				};
			});

		const sdk = new Directus(url);
		const hash = await sdk.utils.hash.generate('wolfulus');

		expect(hash?.substr(0, 7)).toBe('$argon2');

		nock()
			.post('/utils/hash/verify')
			.reply(200, async (_, body: any) => {
				return {
					data: await argon2.verify(body.hash, body.string),
				};
			});

		const result = await sdk.utils.hash.verify('wolfulus', hash || '');

		expect(result).toBe(true);
	});

	test(`sort`, async (url, nock) => {
		nock()
			.post('/utils/sort/posts', {
				item: 10,
				to: 5,
			})
			.reply(204);

		const sdk = new Directus(url);
		await sdk.utils.sort('posts', 10, 5);
	});

	test(`revert`, async (url, nock) => {
		nock().post('/utils/revert/555').reply(204);
		const sdk = new Directus(url);
		await sdk.utils.revert(555);
	});
});
