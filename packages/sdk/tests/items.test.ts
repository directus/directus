import { Blog } from './blog.d';
import { Directus, ItemsOptions, EmptyParamError } from '../src';
import { mockServer, URL } from './utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('items', function () {
	it(`should throw EmptyParamError when using empty string as id`, async () => {
		const sdk = new Directus<Blog>(URL);

		try {
			await sdk.items('posts').readOne('');
		} catch (err: any) {
			expect(err).toBeInstanceOf(EmptyParamError);
		}
	});

	it(`can get an item by id`, async () => {
		mockServer.use(
			rest.get(URL + '/items/posts/1', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							id: 1,
							title: 'My first post',
							body: '<h1>Hey there!</h1>',
						},
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);
		const item = await sdk.items('posts').readOne(1);

		expect(item).not.toBeNull();
		expect(item).not.toBeUndefined();
		expect(item?.id).toBe(1);
		expect(item?.title).toBe(`My first post`);
		expect(item?.body).toBe('<h1>Hey there!</h1>');
	});

	it(`should encode ids`, async () => {
		mockServer.use(
			rest.get(URL + '/items/categories/double%20slash', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							slug: 'double slash',
							name: 'Double Slash',
						},
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);
		const item = await sdk.items('categories').readOne('double slash');

		expect(item).not.toBeNull();
		expect(item).not.toBeUndefined();
		expect(item?.slug).toBe('double slash');
		expect(item?.name).toBe('Double Slash');
	});

	it(`can get multiple items by primary key`, async () => {
		mockServer.use(
			rest.get(URL + '/fields/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [
							{
								collection: 'posts',
								field: 'primary_key',
								schema: { is_primary_key: true },
							},
						],
					})
				)
			),
			rest.get(URL + '/items/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [
							{
								primary_key: 1,
								title: 'My first post',
								body: '<h1>Hey there!</h1>',
								published: false,
							},
							{
								primary_key: 2,
								title: 'My second post',
								body: '<h1>Hey there!</h1>',
								published: true,
							},
						],
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);
		const items = await sdk.items('posts').readMany([1, 2]);

		expect(items.data?.[0]).toMatchObject({
			primary_key: 1,
			title: 'My first post',
			body: '<h1>Hey there!</h1>',
			published: false,
		});

		expect(items.data?.[1]).toMatchObject({
			primary_key: 2,
			title: 'My second post',
			body: '<h1>Hey there!</h1>',
			published: true,
		});
	});

	it(`filter param is sent`, async () => {
		mockServer.use(
			rest.get(URL + '/items/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [
							{
								id: 1,
								title: 'My first post',
							},
							{
								id: 2,
								title: 'My second post',
							},
						],
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);

		const items = await sdk.items('posts').readByQuery({
			fields: ['id', 'title'],
		});

		expect(items.data?.[0]?.id).toBe(1);
		expect(items.data?.[0]?.title).toBe(`My first post`);
		expect((<any>items.data?.[0])?.body).toBeUndefined();

		expect(items.data?.[1]?.id).toBe(2);
		expect(items.data?.[1]?.title).toBe(`My second post`);
		expect((<any>items.data?.[1])?.body).toBeUndefined();
	});

	it(`create one item`, async () => {
		mockServer.use(
			rest.post(URL + '/items/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							id: 3,
							title: 'New post',
							body: 'This is a new post',
							published: false,
						},
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);

		const item = await sdk.items('posts').createOne({
			title: 'New post',
			body: 'This is a new post',
			published: false,
		});

		expect(item).toMatchObject({
			id: 3,
			title: 'New post',
			body: 'This is a new post',
			published: false,
		});
	});

	it(`create many items`, async () => {
		mockServer.use(
			rest.post(URL + '/items/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [
							{
								id: 4,
								title: 'New post 2',
								body: 'This is a new post 2',
								published: false,
							},
							{
								id: 5,
								title: 'New post 3',
								body: 'This is a new post 3',
								published: true,
							},
						],
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);

		const items = await sdk.items('posts').createMany([
			{
				title: 'New post 2',
				body: 'This is a new post 2',
				published: false,
			},
			{
				title: 'New post 3',
				body: 'This is a new post 3',
				published: true,
			},
		]);

		expect(items.data?.[0]).toMatchObject({
			id: 4,
			title: 'New post 2',
			body: 'This is a new post 2',
			published: false,
		});

		expect(items.data?.[1]).toMatchObject({
			id: 5,
			title: 'New post 3',
			body: 'This is a new post 3',
			published: true,
		});
	});

	it(`update one item`, async () => {
		mockServer.use(
			rest.patch(URL + '/items/posts/1', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							id: 1,
							title: 'Updated post',
							body: 'Updated post content',
							published: true,
						},
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);

		const item = await sdk.items('posts').updateOne(1, {
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});

		expect(item).toMatchObject({
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});
	});

	it(`update many item`, async () => {
		mockServer.use(
			rest.patch(URL + '/items/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [
							{
								id: 1,
								title: 'Updated post',
								body: 'Updated post content',
								published: true,
							},
							{
								id: 2,
								title: 'Updated post',
								body: 'Updated post content',
								published: true,
							},
						],
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);

		const items = await sdk.items('posts').updateMany([1, 2], {
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});

		expect(items.data?.[0]).toMatchObject({
			id: 1,
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});

		expect(items.data?.[1]).toMatchObject({
			id: 2,
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});
	});

	it(`update batch`, async () => {
		mockServer.use(
			rest.patch(URL + '/items/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [
							{
								id: 1,
								title: 'Updated post',
								body: 'Updated post content',
								published: true,
							},
							{
								id: 2,
								title: 'Updated post',
								body: 'Updated post content',
								published: true,
							},
						],
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);

		const items = await sdk.items('posts').updateBatch([
			{
				id: 1,
				title: 'Updated post',
				body: 'Updated post content',
				published: true,
			},
			{
				id: 2,
				title: 'Updated post 2',
				body: 'Updated post content 2',
				published: true,
			},
		]);

		expect(items.data?.[0]).toMatchObject({
			id: 1,
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});

		expect(items.data?.[1]).toMatchObject({
			id: 2,
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});
	});

	it(`delete one item`, async () => {
		mockServer.use(rest.delete(URL + '/items/posts/1', (_req, res, ctx) => res(ctx.status(204))));

		const sdk = new Directus<Blog>(URL);
		await expect(sdk.items('posts').deleteOne(1)).resolves.not.toThrowError();
	});

	it(`delete many item`, async () => {
		mockServer.use(rest.delete(URL + '/items/posts', (_req, res, ctx) => res(ctx.status(204))));

		const sdk = new Directus<Blog>(URL);
		await expect(sdk.items('posts').deleteMany([1, 2])).resolves.not.toThrowError();
	});

	it('should passthrough additional headers', async () => {
		const postData = {
			title: 'New post',
			body: 'This is a new post',
			published: false,
		};

		const id = 3;

		const expectedData = {
			id,
			...postData,
		};

		const headerName = 'X-Custom-Header';
		const headerValue = 'Custom header value';

		const customOptions: ItemsOptions = {
			requestOptions: {
				headers: {
					[headerName]: headerValue,
				},
			},
		};

		mockServer.use(
			rest.post(URL + '/items/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: expectedData,
					})
				)
			)
		);

		const sdk = new Directus<Blog>(URL);
		const item = await sdk.items('posts').createOne(postData, undefined, customOptions);
		expect(item).toMatchObject(expectedData);
	});
});
