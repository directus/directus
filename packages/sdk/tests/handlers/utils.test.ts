import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('utils', function () {
	it(`generates random string`, async () => {
		mockServer.use(
			rest.get(URL + '/utils/random/string', (_req, res, ctx) =>
				res(ctx.status(200), ctx.json({ data: '01234567890123456789012345678901' }))
			)
		);

		const sdk = new Directus(URL);
		const str = await sdk.utils.random.string(32);

		expect(str).toBe('01234567890123456789012345678901');
	});

	it(`hash generate`, async () => {
		const HASH = '$argon2i$v=19$m=16,t=2,p=1$YXNkYXNkYXNkYQ$q1exR8e4IRDiD1TR3rGB6g';

		mockServer.use(
			rest.options(URL + '/utils/hash/generate', (_r, res, ctx) => res(ctx.status(200))),
			rest.post(URL + '/utils/hash/generate', async (req, res, ctx) => {
				return res(ctx.status(200), ctx.json({ data: HASH }));
			})
		);

		const sdk = new Directus(URL);
		const hash = await sdk.utils.hash.generate('wolfulus');

		expect(hash).toBe(HASH);
	});

	it(`hash verify`, async () => {
		const HASH = '$argon2i$v=19$m=16,t=2,p=1$YXNkYXNkYXNkYQ$q1exR8e4IRDiD1TR3rGB6g';

		mockServer.use(
			rest.options(URL + '/utils/hash/generate', (_r, res, ctx) => res(ctx.status(200))),
			rest.post(URL + '/utils/hash/generate', async (req, res, ctx) => {
				return res(ctx.status(200), ctx.json({ data: HASH }));
			}),
			rest.options(URL + '/utils/hash/verify', (_r, res, ctx) => res(ctx.status(200))),
			rest.post(URL + '/utils/hash/verify', async (_r, res, ctx) => {
				return res(ctx.status(200), ctx.json({ data: true }));
			})
		);

		const sdk = new Directus(URL);
		const hash = await sdk.utils.hash.generate('wolfulus');

		expect(hash).toBe(HASH);

		const result = await sdk.utils.hash.verify('wolfulus', hash || '');

		expect(result).toBe(true);
	});

	it(`sort`, async () => {
		mockServer.use(
			rest.post(URL + '/utils/sort/posts', async (_r, res, ctx) => {
				return res(ctx.status(204));
			})
		);

		const sdk = new Directus(URL);
		await sdk.utils.sort('posts', 10, 5);
	});

	it(`revert`, async () => {
		mockServer.use(
			rest.post(URL + '/utils/revert/555', async (_r, res, ctx) => {
				return res(ctx.status(204));
			})
		);

		const sdk = new Directus(URL);
		await sdk.utils.revert(555);
	});
});
