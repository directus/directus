import { createDirectus, createItem, deleteItem, readItem, rest, staticToken, updateItem } from '@directus/sdk';
import { useSnapshot } from '../../../utils/useSnapshot';
import { Schema } from './schema';
import { join } from 'path';
import { expect, test } from 'vitest';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const collections = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test(`m2o relation `, async () => {
	const created = await api.request(
		createItem(
			collections.articles,
			{
				author: {
					name: 'Ben',
				},
			},
			{ fields: '*.*' },
		),
	);

	expect(created).toMatchObject({
		author: {
			id: expect.anything(),
			name: 'Ben',
		},
	});

	const updated = await api.request(
		updateItem(
			collections.articles,
			created.id,
			{
				author: {
					id: created.author.id,
					name: 'Tim',
				},
			},
			{ fields: '*.*' },
		),
	);

	const read = await api.request(readItem(collections.articles, created.id, { fields: '*.*' }));

	expect(read).toEqual(updated);

	await api.request(deleteItem(collections.articles, created.id));

	await expect(() => api.request(readItem(collections.articles, created.id))).rejects.toThrowError();
});

test(`o2m relation `, async () => {
	const created = await api.request(
		createItem(
			collections.articles,
			{
				links: [
					{
						link: 'Link A',
					},
					{
						link: 'Link B',
					},
				],
			},
			{ fields: '*.*' },
		),
	);

	expect(created).toMatchObject({
		links: [
			{
				id: expect.anything(),
				article_id: created.id,
				link: 'Link A',
			},
			{
				id: expect.anything(),
				article_id: created.id,
				link: 'Link B',
			},
		],
	});

	const updated = await api.request(
		updateItem(
			collections.articles,
			created.id,
			{
				links: [
					{
						id: created.links[0].id,
						link: 'Link A Updated',
					},
					{
						link: 'Link C',
					},
				],
			},
			{ fields: '*.*' },
		),
	);

	expect(updated).toMatchObject({
		links: [
			{
				id: created.links![0].id,
				article_id: created.id,
				link: 'Link A Updated',
			},
			{
				id: expect.not.toBeOneOf([created.links![1].id]),
				article_id: created.id,
				link: 'Link C',
			},
		],
	});

	const read = await api.request(readItem(collections.articles, created.id, { fields: '*.*' }));

	expect(read).toEqual(updated);

	await api.request(deleteItem(collections.articles, created.id));

	await expect(() => api.request(readItem(collections.articles, created.id))).rejects.toThrowError();
});

test(`m2m relation `, async () => {
	const created = await api.request(
		createItem(
			collections.articles,
			{
				tags: [
					{
						tags_id: {
							tag: 'Tag A',
						},
					},
					{
						tags_id: {
							tag: 'Tag B',
						},
					},
				],
			},
			{ fields: '*.*.*' },
		),
	);

	expect(created).toMatchObject({
		tags: [
			{
				id: expect.anything(),
				articles_id: { id: created.id },
				tags_id: {
					id: expect.anything(),
					tag: 'Tag A',
				},
			},
			{
				id: expect.anything(),
				articles_id: { id: created.id },
				tags_id: {
					id: expect.anything(),
					tag: 'Tag B',
				},
			},
		],
	});

	const updated = await api.request(
		updateItem(
			collections.articles,
			created.id,
			{
				tags: [
					{
						id: created.tags[0].id,
						tags_id: {
							id: created.tags[0].tags_id.id,
							tag: 'Tag A Updated',
						},
					},
					{
						tags_id: {
							tag: 'Tag C',
						},
					},
				],
			},
			{ fields: '*.*.*' },
		),
	);

	expect(updated).toMatchObject({
		tags: [
			{
				id: created.tags[0].id,
				articles_id: { id: created.id },
				tags_id: {
					id: created.tags[0].tags_id.id,
					tag: 'Tag A Updated',
				},
			},
			{
				id: expect.not.toBeOneOf([created.tags[1].id]),
				articles_id: { id: created.id },
				tags_id: {
					id: expect.not.toBeOneOf([created.tags[0].tags_id.id]),
					tag: 'Tag C',
				},
			},
		],
	});

	const read = await api.request(readItem(collections.articles, created.id, { fields: '*.*.*' }));

	expect(read).toEqual(updated);

	await api.request(deleteItem(collections.articles, created.id));

	await expect(() => api.request(readItem(collections.articles, created.id))).rejects.toThrowError();
});

test(`m2a relation `, async () => {
	const created = await api.request(
		createItem(
			collections.articles,
			{
				blocks: [
					{
						collection: collections.text_blocks,
						item: {
							text: 'Block 1',
						},
					},
					{
						collection: collections.date_blocks,
						item: {
							date: '2025-12-24',
						},
					},
				],
			},
			{ fields: '*.*.*' },
		),
	);

	expect(created).toMatchObject({
		blocks: [
			{
				id: expect.anything(),
				articles_id: { id: created.id },
				collection: collections.text_blocks,
				item: {
					id: expect.anything(),
					text: 'Block 1',
				},
			},
			{
				id: expect.anything(),
				articles_id: { id: created.id },
				collection: collections.date_blocks,
				item: {
					id: expect.anything(),
					date: '2025-12-24',
				},
			},
		],
	});

	const updated = await api.request(
		updateItem(
			collections.articles,
			created.id,
			{
				blocks: [
					{
						id: created.blocks[0].id,
						collection: collections.text_blocks,
						item: {
							id: created.blocks[0].item.id,
							text: 'Block 1 Updated',
						},
					},
					{
						collection: collections.text_blocks,
						item: {
							text: 'Block 2',
						},
					},
				],
			},
			{ fields: '*.*.*' },
		),
	);

	expect(updated).toMatchObject({
		blocks: [
			{
				id: created.blocks[0].id,
				articles_id: { id: created.id },
				collection: collections.text_blocks,
				item: {
					id: created.blocks[0].item.id,
					text: 'Block 1 Updated',
				},
			},
			{
				id: expect.not.toBeOneOf([created.blocks[1].id]),
				articles_id: { id: created.id },
				collection: collections.text_blocks,
				item: {
					id: expect.not.toBeOneOf([created.blocks[0].item.id]),
					text: 'Block 2',
				},
			},
		],
	});

	const read = await api.request(readItem(collections.articles, created.id, { fields: '*.*.*' }));

	expect(read).toEqual(updated);

	await api.request(deleteItem(collections.articles, created.id));

	await expect(() => api.request(readItem(collections.articles, created.id))).rejects.toThrowError();
});
