import { createDirectus, createItem, graphql, readItem, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test(`scalar alias (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: ['title', 'aliased'],
			alias: { aliased: 'title' },
		} as any),
	);

	expect(result).toEqual({
		title: 'Article A',
		aliased: 'Article A',
	});
});

test(`scalar alias (GraphQL)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
			}),
		)
	).id!;

	const result = (
		await api.query(`
			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					title
					aliased: title
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		title: 'Article A',
		aliased: 'Article A',
	});
});

test(`m2o alias only (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				author: { name: 'Author A' },
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: ['aliased.name'],
			alias: { aliased: 'author' },
		} as any),
	);

	expect(result).toEqual({
		aliased: { name: 'Author A' },
	});
});

test(`m2o alias only (GraphQL)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				author: { name: 'Author A' },
			}),
		)
	).id!;

	const result = (
		await api.query(`
			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					aliased: author {
						name
					}
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		aliased: { name: 'Author A' },
	});
});

test(`m2o original + alias sharing relation.field (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				author: { name: 'Author A' },
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: ['author.name', 'aliased.name'],
			alias: { aliased: 'author' },
		} as any),
	);

	expect(result).toEqual({
		author: { name: 'Author A' },
		aliased: { name: 'Author A' },
	});
});

test(`m2o original + alias sharing relation.field (GraphQL)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				author: { name: 'Author A' },
			}),
		)
	).id!;

	const result = (
		await api.query(`
			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					author {
						name
					}
					aliased: author {
						name
					}
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		author: { name: 'Author A' },
		aliased: { name: 'Author A' },
	});
});

test(`m2o wildcard + alias (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				author: { name: 'Author A' },
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: ['*', 'aliased.name'],
			alias: { aliased: 'author' },
		} as any),
	);

	expect(result).toMatchObject({
		id,
		title: 'Article A',
		author: expect.anything(),
		aliased: { name: 'Author A' },
	});
});

test(`m2o multiple aliases (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				author: { name: 'Author A' },
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: ['author.name', 'a.name', 'b.name'],
			alias: { a: 'author', b: 'author' },
		} as any),
	);

	expect(result).toEqual({
		author: { name: 'Author A' },
		a: { name: 'Author A' },
		b: { name: 'Author A' },
	});
});

test(`o2m alias only (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				links: [{ link: 'Link A' }],
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: ['aliased.link'],
			alias: { aliased: 'links' },
		} as any),
	);

	expect(result).toEqual({
		aliased: [{ link: 'Link A' }],
	});
});

test(`o2m original + alias (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				links: [{ link: 'Link A' }],
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: ['links.link', 'aliased.link'],
			alias: { aliased: 'links' },
		} as any),
	);

	expect(result).toEqual({
		links: [{ link: 'Link A' }],
		aliased: [{ link: 'Link A' }],
	});
});

test(`o2m original + alias (GraphQL)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				links: [{ link: 'Link A' }],
			}),
		)
	).id!;

	const result = (
		await api.query(`
			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					links { link }
					aliased: links { link }
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		links: [{ link: 'Link A' }],
		aliased: [{ link: 'Link A' }],
	});
});

test(`m2a alias on the junction field (REST)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				blocks: [
					{
						collection: collections.text_blocks,
						item: { text: 'Text Block A' },
					},
				],
			}),
		)
	).id!;

	const result = await api.request(
		readItem(collections.articles, id, {
			fields: [`blocks.item:${collections.text_blocks}.text`, `blocks.aliased:${collections.text_blocks}.text`],
			deep: { blocks: { _alias: { aliased: 'item' } } },
		} as any),
	);

	expect(result).toEqual({
		blocks: [
			{
				item: { text: 'Text Block A' },
				aliased: { text: 'Text Block A' },
			},
		],
	});
});

test(`m2o original + alias inside a fragment`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				author: { name: 'Author A' },
			}),
		)
	).id!;

	const result = (
		await api.query(`
			fragment ArticleSummary on ${collections.articles} {
				author {
					name
				}
				aliased: author {
					name
				}
			}

			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					...ArticleSummary
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		author: { name: 'Author A' },
		aliased: { name: 'Author A' },
	});
});

test(`o2m original + alias inside a fragment`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				links: [{ link: 'Link A' }],
			}),
		)
	).id!;

	const result = (
		await api.query(`
			fragment ArticleSummary on ${collections.articles} {
				links {
					link
				}
				aliased: links {
					link
				}
			}

			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					...ArticleSummary
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		links: [{ link: 'Link A' }],
		aliased: [{ link: 'Link A' }],
	});
});

test(`m2a alias on a scalar field inside the m2a result (GraphQL)`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				blocks: [
					{
						collection: collections.text_blocks,
						item: { text: 'Text Block A' },
					},
				],
			}),
		)
	).id!;

	const result = (
		await api.query(`
			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					blocks {
						item {
							... on ${collections.text_blocks} {
								text
								aliasedText: text
							}
						}
					}
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		blocks: [
			{
				item: { text: 'Text Block A', aliasedText: 'Text Block A' },
			},
		],
	});
});
