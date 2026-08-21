import { createDirectus, createItem, createRole, createUser, graphql, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(graphql()).with(staticToken('admin')).with(rest());

const { collections } = await useSnapshot<Schema>(api);

/** Create an article and return its id, so each test reads back a row it owns */
async function seed(data: Record<string, unknown>) {
	return (await api.request(createItem(collections.articles, { title: 'Article A', ...data }))).id!;
}

test('fragment on an m2a union type', async () => {
	const id = await seed({ blocks: [{ collection: collections.text_blocks, item: { text: 'Text Block A' } }] });

	const result = (
		await api.query(`
			fragment BlockItem on ${collections.articles_blocks}_item_union {
				... on ${collections.text_blocks} { text }
			}

			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					blocks { item { ...BlockItem } }
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({ blocks: [{ item: { text: 'Text Block A' } }] });
});

test('inline fragment on an m2a union type', async () => {
	const id = await seed({ blocks: [{ collection: collections.text_blocks, item: { text: 'Text Block A' } }] });

	const result = (
		await api.query(`
			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					blocks {
						item {
							... on ${collections.articles_blocks}_item_union {
								... on ${collections.text_blocks} { text }
							}
						}
					}
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({ blocks: [{ item: { text: 'Text Block A' } }] });
});

test('fragment on each m2a member type', async () => {
	const date = new Date().toISOString();

	const id = await seed({
		blocks: [
			{ collection: collections.text_blocks, item: { text: 'Text Block A' } },
			{ collection: collections.date_blocks, item: { date } },
		],
	});

	const result = (
		await api.query(`
			fragment TextBlock on ${collections.text_blocks} { text }
			fragment DateBlock on ${collections.date_blocks} { date }

			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					blocks { item { ...TextBlock ...DateBlock } }
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({ blocks: [{ item: { text: 'Text Block A' } }, { item: { date: expect.any(String) } }] });
});

test('fragments nested across relation levels', async () => {
	const id = await seed({
		author: { name: 'Author A' },
		links: [{ link: 'Link A' }],
		tags: [{ tags_id: { tag: 'Tag A' } }],
	});

	const result = (
		await api.query(`
			fragment Article on ${collections.articles} {
				title
				author { ...Author }
				links { ...Link }
				tags { tags_id { tag } }
			}
			fragment Author on ${collections.users} { name }
			fragment Link on ${collections.links} { link }

			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) { ...Article }
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({
		title: 'Article A',
		author: { name: 'Author A' },
		links: [{ link: 'Link A' }],
		tags: [{ tags_id: { tag: 'Tag A' } }],
	});
});

test('fragment inside a function selection set', async () => {
	const id = await seed({ links: [{ link: 'Link A' }, { link: 'Link B' }] });

	const result = (
		await api.query(`
			fragment Counted on count_functions { count }

			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					links_func { ...Counted }
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({ links_func: { count: 2 } });
});

test('fragment on an aggregation', async () => {
	await seed({});

	const result = (
		await api.query(`
			fragment Totals on ${collections.articles}_aggregated { count { id } }

			query {
				${collections.articles}_aggregated { ...Totals }
			}
		`)
	)[`${collections.articles}_aggregated`];

	expect(result[0].count.id).toBeGreaterThan(0);
});

test('fragment in a mutation selection set', async () => {
	const result = (
		await api.query(`
			fragment Created on ${collections.articles} {
				title
				replies: links { link }
			}

			mutation {
				create_${collections.articles}_item (data: { title: "Article B", links: [{ link: "Link A" }] }) {
					...Created
				}
			}
		`)
	)[`create_${collections.articles}_item`];

	expect(result).toEqual({ title: 'Article B', replies: [{ link: 'Link A' }] });
});

// Guards the m2a filter handling of #25895 / #26148 / #26233 against fragment changes
test('fragment alongside an m2a filter', async () => {
	const block = await api.request(createItem(collections.text_blocks, { text: 'Filtered Block' }));
	const id = await seed({ blocks: [{ collection: collections.text_blocks, item: { id: block.id } }] });

	const result = (
		await api.query(`
			fragment BlockItem on ${collections.articles_blocks}_item_union {
				... on ${collections.text_blocks} { text }
			}

			query {
				${collections.articles} (
					filter: { id: { _eq: "${id}" }, blocks: { item__${collections.text_blocks}: { id: { _eq: "${block.id}" } } } }
				) {
					blocks { item { ...BlockItem } }
				}
			}
		`)
	)[collections.articles];

	expect(result).toEqual([{ blocks: [{ item: { text: 'Filtered Block' } }] }]);
});

// Guards the groupBy handling of #26626 / #26706: `group` is not an aggregate function
test('fragment on a grouped aggregation', async () => {
	const id = await seed({ title: 'Grouped Article' });

	const result = (
		await api.query(`
			fragment Totals on ${collections.articles}_aggregated {
				group
				count { id }
			}

			query {
				${collections.articles}_aggregated (groupBy: ["title"], filter: { id: { _eq: "${id}" } }) {
					...Totals
				}
			}
		`)
	)[`${collections.articles}_aggregated`];

	expect(result).toEqual([{ group: { title: 'Grouped Article' }, count: { id: 1 } }]);
});

test('inline fragment with no type condition', async () => {
	const id = await seed({ author: { name: 'Author A' } });

	const result = (
		await api.query(`
			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					... { title author { name } }
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({ title: 'Article A', author: { name: 'Author A' } });
});

test('the same fragment spread twice', async () => {
	const id = await seed({ links: [{ link: 'Link A' }] });

	const result = (
		await api.query(`
			fragment ArticleFields on ${collections.articles} {
				title
				links { link }
			}

			query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) {
					...ArticleFields
					...ArticleFields
				}
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({ title: 'Article A', links: [{ link: 'Link A' }] });
});

test('two fragments on the query selecting the same collection', async () => {
	const id = await seed({ links: [{ link: 'Link A' }] });

	const result = (
		await api.query(`
			fragment Title on Query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) { title }
			}

			fragment Links on Query {
				${collections.articles} (filter: { id: { _eq: "${id}" }}) { links { link } }
			}

			query {
				...Title
				...Links
			}
		`)
	)[collections.articles][0];

	expect(result).toEqual({ title: 'Article A', links: [{ link: 'Link A' }] });
});

test('two fragments on the query aggregating the same collection', async () => {
	await seed({});

	const result = await api.query<Record<string, { count: { id: number; title: number } }[]>>(`
		fragment Ids on Query {
			${collections.articles}_aggregated { count { id } }
		}

		fragment Titles on Query {
			${collections.articles}_aggregated { count { title } }
		}

		query {
			...Ids
			...Titles
		}
	`);

	expect(result[`${collections.articles}_aggregated`]![0]!.count.title).toBeGreaterThan(0);
});

// The system scope has its own resolvers, and they resolve fragments through the same path
test('fragment on a system collection', async () => {
	const role = await api.request(createRole({ name: 'Fragments Role' }));

	const user = await api.request(
		createUser({ email: `fragments-${role.id}@example.com`, password: 'password', role: role.id }),
	);

	const result = await api.query<{ users: { id: string; assigned: { name: string } }[] }>(
		`
			fragment Member on directus_users {
				id
				assigned: role { name }
			}

			query {
				users (filter: { id: { _eq: "${user.id}" }}) { ...Member }
			}
		`,
		undefined,
		'system',
	);

	expect(result.users).toEqual([{ id: user.id, assigned: { name: 'Fragments Role' } }]);
});

test('fragment on a system aggregation', async () => {
	const result = await api.query<{ users_aggregated: { count: { id: number } }[] }>(
		`
			fragment Totals on directus_users_aggregated { count { id } }

			query {
				users_aggregated { ...Totals }
			}
		`,
		undefined,
		'system',
	);

	expect(result.users_aggregated[0]!.count.id).toBeGreaterThan(0);
});
