import { aggregate, createDirectus, createItem, graphql, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { range } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

async function seedArticles(marker: string, count: number) {
	for (const i of range(count)) {
		await api.request(createItem(collections.articles, { title: `${marker}-${i}` }));
	}
}

test('skips the first items of the result set', async () => {
	const marker = 'offset-plain';
	const count = 7;
	const offset = 3;

	await seedArticles(marker, count);

	const filter = { title: { _starts_with: marker } };

	const result = await api.request(readItems(collections.articles, { filter, offset }));

	expect(result.length).toBe(count - offset);

	const gql = (await api.query(`
		query {
			${collections.articles}(filter: { title: { _starts_with: "${marker}" } }, offset: ${offset}) { id }
		}
	`)) as any;

	expect(gql[collections.articles].length).toBe(count - offset);
});

test('combines offset with limit and sort', async () => {
	const marker = 'offset-limit-sort';
	const count = 9;
	const offset = 4;
	const limit = 3;

	await seedArticles(marker, count);

	const filter = { title: { _contains: marker } };

	const asc = await api.request(readItems(collections.articles, { filter, offset, limit, sort: ['title'] }));
	const desc = await api.request(readItems(collections.articles, { filter, offset, limit, sort: ['-title'] }));

	const index = (items: { title: string | number }[]) => items.map((item) => Number(String(item.title).slice(-1)));

	expect(index(asc)).toEqual([4, 5, 6]);
	expect(index(desc)).toEqual([4, 3, 2]);
});

test('applies offset to grouped aggregations', async () => {
	const marker = 'offset-aggregate';
	const count = 10;
	const limit = 3;

	await seedArticles(marker, count);

	const filter = { title: { _contains: marker } };

	const first = await api.request(
		aggregate(collections.articles, {
			query: { filter, offset: 3, limit },
			groupBy: ['id'],
			aggregate: { count: ['id'] },
		}),
	);

	const second = await api.request(
		aggregate(collections.articles, {
			query: { filter, offset: 6, limit },
			groupBy: ['id'],
			aggregate: { count: ['id'] },
		}),
	);

	expect(first.length).toBe(limit);
	expect(second.length).toBe(limit);

	// Two non-overlapping pages must not share a single group
	const firstIds = first.map((row: any) => row.id);
	const secondIds = second.map((row: any) => row.id);

	expect(firstIds.filter((id: unknown) => secondIds.includes(id))).toEqual([]);
});

test('applies offset to grouped aggregations with a sort', async () => {
	const marker = 'offset-aggregate-sort';
	const count = 10;

	await seedArticles(marker, count);

	const filter = { title: { _contains: marker } };

	const all = await api.request(
		aggregate(collections.articles, {
			query: { filter, sort: ['title'], limit: -1 },
			groupBy: ['title'],
			aggregate: { count: ['id'] },
		}),
	);

	const page = await api.request(
		aggregate(collections.articles, {
			query: { filter, sort: ['title'], offset: 3, limit: 6 },
			groupBy: ['title'],
			aggregate: { count: ['id'] },
		}),
	);

	expect(all.length).toBe(count);
	expect(page.map((row: any) => row.title)).toEqual(all.slice(3, 9).map((row: any) => row.title));
});

test('applies offset to nested o2m items', async () => {
	const marker = 'offset-o2m';

	const article = await api.request(
		createItem(collections.articles, {
			title: marker,
			links: range(5).map((i) => ({ link: `${marker}-${i}` })),
		}),
	);

	const [result] = await api.request(
		readItems(collections.articles, {
			filter: { id: { _eq: article.id } },
			fields: ['links.link'],
			deep: { links: { _sort: ['link'], _offset: 2 } },
		}),
	);

	expect(result!.links.map((link: any) => link.link)).toEqual([`${marker}-2`, `${marker}-3`, `${marker}-4`]);
});
