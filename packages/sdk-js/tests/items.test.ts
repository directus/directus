/**
 * @jest-environment node
 */

import { Post } from '.';
import { Directus } from '../src';
import { test } from './utils';

describe('items', function () {
	test(`can get an item by id`, async (url, nock) => {
		nock()
			.get('/items/posts/1')
			.reply(200, {
				data: {
					id: 1,
					title: 'My first post',
					body: '<h1>Hey there!</h1>',
				},
			});

		type Post = {
			id: number;
			title: string;
			body: string;
		};

		const sdk = new Directus(url);
		const item = await sdk.items<Post>('posts').readOne(1);

		expect(item).not.toBeNull();
		expect(item).not.toBeUndefined();
		expect(item!.id).toBe(1);
		expect(item!.title).toBe(`My first post`);
		expect(item!.body).toBe('<h1>Hey there!</h1>');
	});

	test(`should encode ids`, async (url, nock) => {
		nock()
			.get('/items/categories/double%20slash')
			.reply(200, {
				data: {
					slug: 'double slash',
					name: 'Double Slash',
				},
			});

		type Category = {
			slug: string;
			name: string;
		};

		const sdk = new Directus(url);
		const item = await sdk.items<Category>('categories').readOne('double slash');

		expect(item).not.toBeNull();
		expect(item).not.toBeUndefined();
		expect(item!.slug).toBe('double slash');
		expect(item!.name).toBe('Double Slash');
	});

	test(`can get multiple items by id`, async (url, nock) => {
		nock()
			.get('/items/posts')
			.reply(200, {
				data: [
					{
						id: 1,
						title: 'My first post',
						body: '<h1>Hey there!</h1>',
						published: false,
					},
					{
						id: 2,
						title: 'My second post',
						body: '<h1>Hey there!</h1>',
						published: true,
					},
				],
			});

		const sdk = new Directus(url);
		const items = await sdk.items<Post>('posts').readMany();

		expect(items.data![0]).toMatchObject({
			id: 1,
			title: 'My first post',
			body: '<h1>Hey there!</h1>',
			published: false,
		});

		expect(items.data![1]).toMatchObject({
			id: 2,
			title: 'My second post',
			body: '<h1>Hey there!</h1>',
			published: true,
		});
	});

	test(`filter param is sent`, async (url, nock) => {
		nock()
			.get('/items/posts')
			.query({
				'fields[]': ['id', 'title'],
			})
			.reply(200, {
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
			});

		const sdk = new Directus(url);
		const items = await sdk.items<Post>('posts').readMany({
			fields: ['id', 'title'],
		});

		expect(items.data![0]!.id).toBe(1);
		expect(items.data![0]!.title).toBe(`My first post`);
		expect(items.data![0]!.body).toBeUndefined();

		expect(items.data![1]!.id).toBe(2);
		expect(items.data![1]!.title).toBe(`My second post`);
		expect(items.data![1]!.body).toBeUndefined();
	});

	test(`create one item`, async (url, nock) => {
		nock()
			.post('/items/posts')
			.reply(200, {
				data: {
					id: 3,
					title: 'New post',
					body: 'This is a new post',
					published: false,
				},
			});

		const sdk = new Directus(url);
		const item = await sdk.items<Post>('posts').createOne({
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

	test(`create many items`, async (url, nock) => {
		nock()
			.post('/items/posts')
			.reply(200, {
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
			});

		const sdk = new Directus(url);
		const items = await sdk.items<Post>('posts').createMany([
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

		expect(items.data![0]).toMatchObject({
			id: 4,
			title: 'New post 2',
			body: 'This is a new post 2',
			published: false,
		});

		expect(items.data![1]).toMatchObject({
			id: 5,
			title: 'New post 3',
			body: 'This is a new post 3',
			published: true,
		});
	});

	test(`update one item`, async (url, nock) => {
		nock()
			.patch('/items/posts/1')
			.reply(200, {
				data: {
					id: 1,
					title: 'Updated post',
					body: 'Updated post content',
					published: true,
				},
			});

		const sdk = new Directus(url);
		const item = await sdk.items<Post>('posts').updateOne(1, {
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

	test(`update many item`, async (url, nock) => {
		nock()
			.patch('/items/posts')
			.reply(200, {
				data: [
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
				],
			});

		const sdk = new Directus(url);
		const item = await sdk.items<Post>('posts').updateMany([
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

		expect(item.data![0]).toMatchObject({
			id: 1,
			title: 'Updated post',
			body: 'Updated post content',
			published: true,
		});

		expect(item.data![1]).toMatchObject({
			id: 2,
			title: 'Updated post 2',
			body: 'Updated post content 2',
			published: true,
		});
	});

	test(`delete one item`, async (url, nock) => {
		const scope = nock().delete('/items/posts/1').reply(204);

		const sdk = new Directus(url);
		await sdk.items<Post>('posts').deleteOne(1);

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`delete many item`, async (url, nock) => {
		const scope = nock().delete('/items/posts').reply(204);

		const sdk = new Directus(url);
		await sdk.items<Post>('posts').deleteMany([1, 2]);

		expect(scope.pendingMocks().length).toBe(0);
	});
});
