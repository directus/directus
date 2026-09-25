import { createDirectus, createItem, graphql, readItems, rest, staticToken } from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { range } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test(`string _eq`, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						title: `Article ${i}`,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				title: { _eq: 'Article 1' },
			},
		}),
	);

	expect(result.length).toBe(1);
	expect(result[0]?.title).toBe('Article 1');
});

test(`number _gte`, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _gte: 50 },
			},
		}),
	);

	expect(result.length).toBe(5);
});

test(`number _gt`, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _gt: 50 },
			},
		}),
	);

	expect(result.length).toBe(4);
});

test(`number _between`, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _between: [30, 60] },
			},
		}),
	);

	expect(result.length).toBe(4);
	expect(result.map((r) => r.votes).sort()).toEqual([30, 40, 50, 60]);
});

test(`number _nbetween`, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _nbetween: [30, 60] },
			},
		}),
	);

	expect(result.length).toBe(6);
	expect(result.map((r) => r.votes).sort()).toEqual([0, 10, 20, 70, 80, 90]);
});

test(`string _eq on m2m relation`, async () => {
	await api.request(
		createItem(collections.articles, {
			title: 'Article A',
			tags: [
				{
					tags_id: {
						tag: 'Tag A',
					},
				},
			],
		}),
	);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				tags: {
					tags_id: {
						tag: {
							_eq: 'Tag A',
						},
					},
				},
			},
			fields: '*.*.*',
		}),
	);

	expect(result.at(-1)?.title).toBe('Article A');
	expect(result.at(-1)?.tags[0]?.tags_id.tag).toBe('Tag A');
});

if (database !== 'oracle')
	test(`string _eq on m2a relation`, async () => {
		await api.request(
			createItem(collections.articles, {
				title: `Article B`,
				blocks: [
					{
						collection: collections.text_blocks,
						item: {
							text: 'Text Block 1',
						},
					},
				],
			}),
		);

		const result = await api.request(
			readItems(collections.articles, {
				filter: {
					blocks: {
						[`item:${collections.text_blocks}`]: {
							text: {
								_eq: 'Text Block 1',
							},
						},
					},
				},
				fields: '*.*.*',
			}),
		);

		expect(result.at(-1)?.title).toBe('Article B');
		expect(result.at(-1)?.blocks[0]?.collection).toBe(collections.text_blocks);
		expect(result.at(-1)?.blocks[0]?.item.text).toBe('Text Block 1');
	});

test(`string _eq on m2o relation`, async () => {
	const marker = 'filter-m2o';

	await api.request(createItem(collections.articles, { title: marker, author: { name: `${marker}-author` } }));
	await api.request(createItem(collections.articles, { title: marker, author: { name: `${marker}-other` } }));

	const result = await api.request(
		readItems(collections.articles, {
			filter: { title: { _eq: marker }, author: { name: { _eq: `${marker}-author` } } },
		}),
	);

	expect(result.length).toBe(1);
});

test(`string _eq on o2m relation`, async () => {
	const marker = 'filter-o2m';

	await api.request(createItem(collections.articles, { title: marker, links: [{ link: `${marker}-a` }] }));
	await api.request(createItem(collections.articles, { title: marker, links: [{ link: `${marker}-b` }] }));

	const result = await api.request(
		readItems(collections.articles, {
			filter: { title: { _eq: marker }, links: { link: { _eq: `${marker}-a` } } },
		}),
	);

	expect(result.length).toBe(1);
});

test(`_some and _none on o2m relation`, async () => {
	const marker = 'filter-some-none';

	await api.request(createItem(collections.articles, { title: `${marker}-with`, links: [{ link: `${marker}-a` }] }));
	await api.request(createItem(collections.articles, { title: `${marker}-without` }));

	const some = await api.request(
		readItems(collections.articles, {
			filter: { title: { _starts_with: marker }, links: { _some: { link: { _starts_with: marker } } } },
		} as any),
	);

	const none = await api.request(
		readItems(collections.articles, {
			filter: { title: { _starts_with: marker }, links: { _none: { link: { _starts_with: marker } } } },
		} as any),
	);

	expect(some.map((item) => item.title)).toEqual([`${marker}-with`]);
	expect(none.map((item) => item.title)).toEqual([`${marker}-without`]);
});

test(`count() function filter on the top level`, async () => {
	const marker = 'filter-fn-count';

	await api.request(
		createItem(collections.articles, {
			title: marker,
			links: [{ link: `${marker}-1` }, { link: `${marker}-2` }],
		}),
	);

	await api.request(createItem(collections.articles, { title: marker }));

	const filtered = await api.request(
		readItems(collections.articles, {
			filter: { _and: [{ title: { _eq: marker } }, { 'count(links)': { _eq: 2 } }] } as any,
		}),
	);

	const all = await api.request(readItems(collections.articles, { filter: { title: { _eq: marker } } }));

	expect(filtered.length).toBe(1);
	expect(all.length).toBe(2);

	const gql = (await api.query(`
		query {
			${collections.articles}(filter: { _and: [
				{ title: { _eq: "${marker}" } },
				{ links_func: { count: { _eq: 2 } } }
			] }) { title }
		}
	`)) as any;

	expect(gql[collections.articles].length).toBe(1);
});

test(`year() function filter on the top level`, async () => {
	const marker = 'filter-fn-year';

	await api.request(createItem(collections.articles, { title: marker, release: '2001-06-01T00:00:00' }));
	await api.request(createItem(collections.articles, { title: marker, release: '2002-06-01T00:00:00' }));

	const result = await api.request(
		readItems(collections.articles, {
			filter: { _and: [{ title: { _eq: marker } }, { 'year(release)': { _eq: 2001 } }] } as any,
		}),
	);

	expect(result.length).toBe(1);
});

test(`function filter on a relational level`, async () => {
	const marker = 'filter-fn-nested';

	await api.request(
		createItem(collections.articles, {
			title: `${marker}-match`,
			release: '2001-06-01T00:00:00',
			links: [{ link: `${marker}-a` }],
		}),
	);

	await api.request(
		createItem(collections.articles, {
			title: `${marker}-miss`,
			release: '2002-06-01T00:00:00',
			links: [{ link: `${marker}-b` }],
		}),
	);

	const result = await api.request(
		readItems(collections.links, {
			filter: {
				_and: [{ link: { _starts_with: marker } }, { article_id: { 'year(release)': { _eq: 2001 } } }],
			} as any,
		}),
	);

	expect(result.map((item) => item.link)).toEqual([`${marker}-a`]);
});

test(`$FOLLOW filter resolves an ad hoc o2m relation`, async () => {
	const marker = 'filter-follow';

	const article = await api.request(
		createItem(collections.articles, { title: marker, tags: [{ tags_id: { tag: marker } }] }, { fields: '*.*.*' }),
	);

	const tagId = (article as any).tags[0].tags_id.id;

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				[`$FOLLOW(${collections.articles_tags},articles_id)`]: { _some: { tags_id: { _eq: tagId } } },
			} as any,
		}),
	);

	expect(result.map((item) => item.title)).toEqual([marker]);
});

test(`_and and _or combine conditions`, async () => {
	const marker = 'filter-logical';

	await api.request(createItem(collections.articles, { title: `${marker}-a`, votes: 1 }));
	await api.request(createItem(collections.articles, { title: `${marker}-b`, votes: 2 }));
	await api.request(createItem(collections.articles, { title: `${marker}-c`, votes: 3 }));

	const and = await api.request(
		readItems(collections.articles, {
			filter: { _and: [{ title: { _starts_with: marker } }, { votes: { _eq: 2 } }] },
		}),
	);

	const or = await api.request(
		readItems(collections.articles, {
			filter: { _and: [{ title: { _starts_with: marker } }, { _or: [{ votes: { _eq: 1 } }, { votes: { _eq: 3 } }] }] },
		}),
	);

	expect(and.map((item) => item.title)).toEqual([`${marker}-b`]);
	expect(or.map((item) => item.title)).toEqual([`${marker}-a`, `${marker}-c`]);
});

test(`array indices beyond 20 are still parsed as an array`, async () => {
	const marker = 'filter-array-index';
	const count = 30;

	const ids = [];

	for (const i of range(count)) {
		const item = await api.request(createItem(collections.articles, { title: `${marker}-${i}` }));
		ids.push(item.id);
	}

	// filter[id][_in][0]=..&filter[id][_in][1]=.. — qs parses indices over 20 as an object unless allowed
	const query = ids.map((id, index) => `filter[id][_in][${index}]=${id}`).join('&');

	const response = await fetch(`http://localhost:${port}/items/${collections.articles}?${query}`, {
		headers: { Authorization: 'Bearer admin' },
	});

	expect(response.status).toBe(200);
	expect(((await response.json()) as any).data.length).toBe(count);
});
