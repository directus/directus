import type { QueryFilter as SdkQueryFilter } from '@directus/sdk';
import { aggregate, createDirectus, createItem, graphql, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { range } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Articles, Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

type QueryFilter = SdkQueryFilter<Schema, Articles>;

test('count of the primary key returns matching items, not join rows, across an m2m filter (REST)', async () => {
	const marker = 'm2m-count-id';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-${i}-${t}` } })),
			}),
		);
	}

	const filter: QueryFilter = { tags: { tags_id: { tag: { _starts_with: marker } } } };

	const items = await api.request(readItems(collections.articles, { filter, limit: -1 }));

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { count: ['id'] } }),
	);

	expect(items.length).toBe(4);
	expect(Number((result as any).count.id)).toBe(4);
});

test('count(*) returns matching items across an m2m filter (REST)', async () => {
	const marker = 'm2m-count-star';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-${i}-${t}` } })),
			}),
		);
	}

	const filter: QueryFilter = { tags: { tags_id: { tag: { _starts_with: marker } } } };

	const [result] = await api.request(aggregate(collections.articles, { query: { filter }, aggregate: { count: '*' } }));

	expect(Number((result as any).count)).toBe(4);
});

test('countDistinct on the primary key matches count across an m2m filter (REST)', async () => {
	const marker = 'm2m-count-distinct';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-${i}-${t}` } })),
			}),
		);
	}

	const filter: QueryFilter = { tags: { tags_id: { tag: { _starts_with: marker } } } };

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { countDistinct: ['id'] } }),
	);

	expect(Number((result as any).countDistinct.id)).toBe(4);
});

test('count is not inflated when the m2m filter uses an explicit _some (REST)', async () => {
	const marker = 'm2m-some';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-${i}-${t}` } })),
			}),
		);
	}

	const filter = { tags: { _some: { tags_id: { tag: { _starts_with: marker } } } } } as QueryFilter;

	const items = await api.request(readItems(collections.articles, { filter, limit: -1 }));

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { count: ['id'] } }),
	);

	expect(items.length).toBe(4);
	expect(Number((result as any).count.id)).toBe(4);
});

test('count returns matching items across an o2m filter, with and without _some (REST)', async () => {
	const marker = 'o2m-count';

	for (const i of range(3)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				links: range(2).map((l) => ({ link: `${marker}-${i}-${l}` })),
			}),
		);
	}

	const filter: QueryFilter = { links: { link: { _starts_with: marker } } };
	const filterSome = { links: { _some: { link: { _starts_with: marker } } } } as QueryFilter;

	const items = await api.request(readItems(collections.articles, { filter, limit: -1 }));

	const [byDefault] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { count: ['id'] } }),
	);

	const [bySome] = await api.request(
		aggregate(collections.articles, { query: { filter: filterSome }, aggregate: { count: ['id'] } }),
	);

	expect(items.length).toBe(3);
	expect(Number((byDefault as any).count.id)).toBe(3);
	expect(Number((bySome as any).count.id)).toBe(3);
});

test('count is unaffected by a non-multiplying m2o filter (REST)', async () => {
	const marker = 'm2o-count';

	for (const i of range(5)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				author: { name: `${marker}-author` },
			}),
		);
	}

	const filter: QueryFilter = { author: { name: { _eq: `${marker}-author` } } };

	const items = await api.request(readItems(collections.articles, { filter, limit: -1 }));

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { count: ['id'] } }),
	);

	expect(items.length).toBe(5);
	expect(Number((result as any).count.id)).toBe(5);
});

test('count matches item count when the relational filter is wrapped in _or (REST)', async () => {
	const marker = 'or-count';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-${i}-${t}` } })),
			}),
		);
	}

	const filter = { _or: [{ tags: { tags_id: { tag: { _starts_with: marker } } } }] } as QueryFilter;

	const items = await api.request(readItems(collections.articles, { filter, limit: -1 }));

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { count: ['id'] } }),
	);

	expect(items.length).toBe(4);
	expect(Number((result as any).count.id)).toBe(4);
});

test('count matches item count for a combined scalar + m2o + m2m filter (REST)', async () => {
	const marker = 'combined-count';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				votes: 1,
				author: { name: `${marker}-author` },
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-${i}-${t}` } })),
			}),
		);
	}

	const filter: QueryFilter = {
		votes: { _eq: 1 },
		author: { name: { _eq: `${marker}-author` } },
		tags: { tags_id: { tag: { _starts_with: marker } } },
	};

	const items = await api.request(readItems(collections.articles, { filter, limit: -1 }));

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { count: ['id'] } }),
	);

	expect(items.length).toBe(4);
	expect(Number((result as any).count.id)).toBe(4);
});

test('grouped count of the primary key counts distinct items per group across an m2m filter (REST)', async () => {
	const marker = 'group-count';

	for (const i of range(3)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-a-${i}`,
				votes: 1,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-a-${i}-${t}` } })),
			}),
		);
	}

	for (const i of range(2)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-b-${i}`,
				votes: 2,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-b-${i}-${t}` } })),
			}),
		);
	}

	const filter: QueryFilter = { tags: { tags_id: { tag: { _starts_with: marker } } } };

	const result = await api.request(
		aggregate(collections.articles, { query: { filter }, groupBy: ['votes'], aggregate: { count: ['id'] } }),
	);

	const byVotes = Object.fromEntries(result.map((row: any) => [row.votes, Number(row.count.id)]));

	expect(byVotes).toEqual({ 1: 3, 2: 2 });
});

test('grouped count with a limit keeps per-group counts correct across an m2m filter (REST)', async () => {
	const marker = 'group-limit-count';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-a-${i}`,
				votes: 1,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-a-${i}-${t}` } })),
			}),
		);
	}

	for (const i of range(3)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-b-${i}`,
				votes: 2,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-b-${i}-${t}` } })),
			}),
		);
	}

	for (const i of range(2)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-c-${i}`,
				votes: 3,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-c-${i}-${t}` } })),
			}),
		);
	}

	const filter: QueryFilter = { tags: { tags_id: { tag: { _starts_with: marker } } } };

	const result = await api.request(
		aggregate(collections.articles, {
			query: { filter, sort: ['votes'], limit: 2 },
			groupBy: ['votes'],
			aggregate: { count: ['id'] },
		}),
	);

	expect(result.map((row: any) => ({ votes: row.votes, count: Number(row.count.id) }))).toEqual([
		{ votes: 1, count: 4 },
		{ votes: 2, count: 3 },
	]);
});

test('countAll returns matching items across an m2m filter (GraphQL)', async () => {
	const marker = 'gql-countall';

	for (const i of range(4)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				tags: range(3).map((t) => ({ tags_id: { tag: `${marker}-${i}-${t}` } })),
			}),
		);
	}

	const result = (await api.query(`
		query {
			agg: ${collections.articles}_aggregated(filter: { tags: { tags_id: { tag: { _starts_with: "${marker}" } } } }) {
				countAll
				count { id }
			}
			data: ${collections.articles}(filter: { tags: { tags_id: { tag: { _starts_with: "${marker}" } } } }, limit: -1) {
				id
			}
		}
	`)) as any;

	expect(result.data.length).toBe(4);
	expect(Number(result.agg[0].countAll)).toBe(4);
	expect(Number(result.agg[0].count.id)).toBe(4);
});

test('count of a field returns the number of non-null values (REST)', async () => {
	const marker = 'base-count-field';

	await Promise.all([
		...range(3).map((i) => api.request(createItem(collections.articles, { title: `${marker}-${i}`, votes: i }))),
		api.request(createItem(collections.articles, { title: `${marker}-null` })),
	]);

	const filter = { title: { _starts_with: marker } };

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { count: ['id', 'votes'] } }),
	);

	expect(Number((result as any).count.id)).toBe(4);
	expect(Number((result as any).count.votes)).toBe(3);
});

test('count(*) returns the total number of matching items (REST)', async () => {
	const marker = 'base-count-star';

	await Promise.all(range(5).map((i) => api.request(createItem(collections.articles, { title: `${marker}-${i}` }))));

	const filter = { title: { _starts_with: marker } };

	const [result] = await api.request(aggregate(collections.articles, { query: { filter }, aggregate: { count: '*' } }));

	expect(Number((result as any).count)).toBe(5);
});

test('countDistinct returns the number of distinct values of a field (REST)', async () => {
	const marker = 'base-count-distinct';

	await Promise.all([
		...range(3).map((i) => api.request(createItem(collections.articles, { title: `${marker}-${i}`, votes: 1 }))),
		...range(2).map((i) => api.request(createItem(collections.articles, { title: `${marker}-b-${i}`, votes: 2 }))),
	]);

	const filter = { title: { _starts_with: marker } };

	const [result] = await api.request(
		aggregate(collections.articles, { query: { filter }, aggregate: { countDistinct: ['votes'] } }),
	);

	expect(Number((result as any).countDistinct.votes)).toBe(2);
});

test('countAll returns the total number of matching items (GraphQL)', async () => {
	const marker = 'base-countall';

	await Promise.all(range(5).map((i) => api.request(createItem(collections.articles, { title: `${marker}-${i}` }))));

	const result = (await api.query(`
		query {
			agg: ${collections.articles}_aggregated(filter: { title: { _starts_with: "${marker}" } }) {
				countAll
			}
		}
	`)) as any;

	expect(Number(result.agg[0].countAll)).toBe(5);
});
