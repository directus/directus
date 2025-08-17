import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '../../../utils/useSnapshot';
import { Schema } from './schema';
import { join } from 'path';
import { expect, test } from 'vitest';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const collections = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test(`m2o relation `, async () => {
	const result = await api.request(
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

	expect(result.author.name).toBe('Ben');
	expect(result.author.id).toBeDefined();
});

test(`o2m relation `, async () => {
	const result = await api.request(
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

	expect(result.links[0].link).toBe('Link A');
	expect(result.links[0].article_id).toBe(result.id);
	expect(result.links[0].id).toBeDefined();
	expect(result.links[1].link).toBe('Link B');
	expect(result.links[1].article_id).toBe(result.id);
	expect(result.links[1].id).toBeDefined();
});

test(`m2m relation `, async () => {
	const result = await api.request(
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

	console.log(result);

	expect(result.tags[0].tags_id.tag).toBe('Tag A');
	expect(result.tags[0].articles_id.id).toBe(result.id);
	expect(result.tags[0].id).toBeDefined();
	expect(result.tags[0].tags_id.id).toBeDefined();
	expect(result.tags[1].tags_id.tag).toBe('Tag B');
	expect(result.tags[1].articles_id.id).toBe(result.id);
	expect(result.tags[1].id).toBeDefined();
	expect(result.tags[1].tags_id.id).toBeDefined();
});
