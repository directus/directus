import { updateItem } from '@directus/sdk';
import { expect, test } from 'vitest';
import type { Articles, Schema } from './schema.d.ts';

import { createDirectus, graphql, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '@utils/useSnapshot.js';
import { join } from 'path';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`)
	.with(graphql())
	.with(rest())
	.with(staticToken('admin'));

const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test('graphql crud', async () => {
	const item: Articles = {
		title: 'GraphQL Article',
		author: {
			name: 'GraphQL Author',
		},
		links: [
			{
				link: 'Link A',
			},
			{
				link: 'Link B',
			},
		],
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
		blocks: [
			// Disabled due to GQL not yet supporting union types on input
			// {
			// 	collection: collections.text_blocks,
			// 	item: {
			// 		text: 'Text Block A',
			// 	},
			// },
			// {
			// 	collection: collections.date_blocks,
			// 	item: {
			// 		date: new Date().toISOString(),
			// 	},
			// },
		],
	};

	const create: Articles = (
		await api.query(`
		mutation {
			create_${collections.articles}_item (data: ${toGQLInput(item)}) {
				id
				title
			}
		}
	`)
	)[`create_${collections.articles}_item`];

	expect(create).toMatchObject({ id: expect.anything(), title: 'GraphQL Article' });

	await api.request(
		updateItem(collections.articles, create.id, {
			blocks: [
				{
					collection: collections.text_blocks,
					item: {
						text: 'Text Block A',
					},
				},
				{
					collection: collections.date_blocks,
					item: {
						date: new Date().toISOString(),
					},
				},
			],
		}),
	);

	const read: Articles[] = (
		await api.query(`
		query {
			${collections.articles} (filter: { id: { _eq: "${create.id}" }}) {
				id
				title
				author {
					id
					name
				}
				links {
					id
					link
				}
				tags {
					tags_id {
						id
						tag
					}
				}
				blocks {
					id
					collection
					item {
						... on ${collections.text_blocks} {
							id
							text
						}
						... on ${collections.date_blocks} {
							id
							date
						}
					}
				}
			}
		}
	`)
	)[collections.articles];

	expect(read).toMatchObject([
		{
			id: create.id,
			title: 'GraphQL Article',
			author: {
				id: expect.anything(),
				name: 'GraphQL Author',
			},
			links: [
				{ id: expect.anything(), link: 'Link A' },
				{ id: expect.anything(), link: 'Link B' },
			],
			tags: [
				{ tags_id: { id: expect.anything(), tag: 'Tag A' } },
				{ tags_id: { id: expect.anything(), tag: 'Tag B' } },
			],
			blocks: [
				{ collection: collections.text_blocks, item: { id: expect.anything(), text: 'Text Block A' } },
				{ collection: collections.date_blocks, item: { id: expect.anything(), date: expect.any(String) } },
			],
		},
	]);

	const updates = {
		title: 'GraphQL Article Updated',
		author: {
			id: read[0]?.author.id,
			name: 'GraphQL Author Updated',
		},
		links: [
			{
				id: read[0]?.links[0]?.id,
				link: 'Link A Updated',
			},
			{
				link: 'Link C',
			},
		],
		tags: [
			{
				id: read[0]?.tags[0]?.id,
				tags_id: {
					id: read[0]?.tags[0]?.tags_id.id,
					tag: 'Tag A Updated',
				},
			},
			{
				tags_id: {
					tag: 'Tag C',
				},
			},
		],
	};

	const update: Articles = (
		await api.query(`
		mutation {
			update_${collections.articles}_item (id: "${create.id}", data: ${toGQLInput(updates)}) {
				id
				title
				author {
					id
					name
				}
				links {
					id
					link
				}
				tags {
					tags_id {
						id
						tag
					}
				}
			}
		}
	`)
	)[`update_${collections.articles}_item`];

	expect(update).toMatchObject({
		id: create.id,
		title: 'GraphQL Article Updated',
		author: {
			id: read[0]?.author.id,
			name: 'GraphQL Author Updated',
		},
		links: [
			{ id: read[0]?.links[0]?.id, link: 'Link A Updated' },
			{ id: expect.anything(), link: 'Link C' },
		],
		tags: [
			{ tags_id: { id: read[0]?.tags[0]?.tags_id.id, tag: 'Tag A Updated' } },
			{ tags_id: { id: expect.anything(), tag: 'Tag C' } },
		],
	});

	const deleted = (
		await api.query(`
		mutation {
			delete_${collections.articles}_item (id: "${create.id}") {
				id
			}
		}
	`)
	)[`delete_${collections.articles}_item`];

	expect(deleted).toMatchObject({ id: create.id });

	const deletedRead: Articles[] = (
		await api.query(`
		query {
			${collections.articles}_by_id (id: "${create.id}") {
				id
			}
		}
	`)
	)[`${collections.articles}_by_id`];

	expect(deletedRead).toBeNull();
});

function toGQLInput(obj: any) {
	return JSON.stringify(obj).replaceAll(/"([^"]+)":/g, '$1:');
}
