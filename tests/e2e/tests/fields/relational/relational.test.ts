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

	expect(created.author.name).toBe('Ben');
	expect(created.author.id).toBeDefined();

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

	expect(updated.author.name).toBe('Tim');
	expect(updated.author.id).toBe(created.author.id);

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

	expect(created.links[0].link).toBe('Link A');
	expect(created.links[0].article_id).toBe(created.id);
	expect(created.links[0].id).toBeDefined();

	expect(created.links[1].link).toBe('Link B');
	expect(created.links[1].article_id).toBe(created.id);
	expect(created.links[1].id).toBeDefined();

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

	expect(updated.links[0].link).toBe('Link A Updated');
	expect(updated.links[0].article_id).toBe(updated.id);
	expect(updated.links[0].id).toBe(created.links[0].id);

	expect(updated.links[1].link).toBe('Link C');
	expect(updated.links[1].article_id).toBe(updated.id);
	expect(updated.links[1].id).not.toBe(created.links[1].id);

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

	expect(created.tags[0].tags_id.tag).toBe('Tag A');
	expect(created.tags[0].articles_id.id).toBe(created.id);
	expect(created.tags[0].id).toBeDefined();
	expect(created.tags[0].tags_id.id).toBeDefined();

	expect(created.tags[1].tags_id.tag).toBe('Tag B');
	expect(created.tags[1].articles_id.id).toBe(created.id);
	expect(created.tags[1].id).toBeDefined();
	expect(created.tags[1].tags_id.id).toBeDefined();

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

	expect(updated.tags[0].tags_id.tag).toBe('Tag A Updated');
	expect(updated.tags[0].articles_id.id).toBe(created.id);
	expect(updated.tags[0].id).toBe(created.tags[0].id);
	expect(updated.tags[0].tags_id.id).toBe(created.tags[0].tags_id.id);

	expect(updated.tags[1].tags_id.tag).toBe('Tag C');
	expect(updated.tags[1].articles_id.id).toBe(created.id);
	expect(updated.tags[1].id).not.toBe(created.tags[1].id);
	expect(updated.tags[1].tags_id.id).not.toBe(created.tags[1].tags_id.id);

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

	expect(created.blocks[0].item.text).toBe('Block 1');
	expect(created.blocks[0].articles_id.id).toBe(created.id);
	expect(created.blocks[0].collection).toBe(collections.text_blocks);
	expect(created.blocks[0].id).toBeDefined();
	expect(created.blocks[0].item.id).toBeDefined();

	expect(created.blocks[1].item.date).toBe('2025-12-24');
	expect(created.blocks[1].articles_id.id).toBe(created.id);
	expect(created.blocks[1].collection).toBe(collections.date_blocks);
	expect(created.blocks[1].id).toBeDefined();
	expect(created.blocks[1].item.id).toBeDefined();

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

	expect(updated.blocks[0].item.text).toBe('Block 1 Updated');
	expect(updated.blocks[0].articles_id.id).toBe(created.id);
	expect(updated.blocks[0].collection).toBe(collections.text_blocks);
	expect(updated.blocks[0].id).toBe(created.blocks[0].id);
	expect(updated.blocks[0].item.id).toBe(created.blocks[0].item.id);

	expect(updated.blocks[1].item.text).toBe('Block 2');
	expect(updated.blocks[1].articles_id.id).toBe(created.id);
	expect(updated.blocks[1].collection).toBe(collections.text_blocks);
	expect(updated.blocks[1].id).not.toBe(created.blocks[1].id);
	expect(updated.blocks[1].item.id).not.toBe(created.blocks[1].item.id);

	const read = await api.request(readItem(collections.articles, created.id, { fields: '*.*.*' }));

	expect(read).toEqual(updated);

	await api.request(deleteItem(collections.articles, created.id));

	await expect(() => api.request(readItem(collections.articles, created.id))).rejects.toThrowError();
});
