import { createDirectus, createItem, graphql, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

/** The order items are inserted in, so that a correct result can never be the insertion order. */
const INSERT_ORDER = [4, 2, 3, 5, 1];

/** Trailing digit of each title, which is what every assertion below compares on. */
function order(items: { title: string | number }[]) {
	return items.map((item) => Number(String(item.title).slice(-1)));
}

async function seedArticles(marker: string, item: (n: number) => Record<string, unknown> = () => ({})) {
	for (const n of INSERT_ORDER) {
		await api.request(createItem(collections.articles, { title: `${marker}-${n}`, ...item(n) }));
	}
}

test('sorts on the top level ascending and descending', async () => {
	const marker = 'sort-top';
	await seedArticles(marker);

	const filter = { title: { _starts_with: marker } };

	const asc = await api.request(readItems(collections.articles, { sort: ['title'], filter }));
	const desc = await api.request(readItems(collections.articles, { sort: ['-title'], filter }));

	expect(order(asc)).toEqual([1, 2, 3, 4, 5]);
	expect(order(desc)).toEqual([5, 4, 3, 2, 1]);

	const gql = (await api.query(`
		query {
			asc: ${collections.articles}(sort: ["title"], filter: { title: { _starts_with: "${marker}" } }) { title }
			desc: ${collections.articles}(sort: ["-title"], filter: { title: { _starts_with: "${marker}" } }) { title }
		}
	`)) as any;

	expect(order(gql.asc)).toEqual([1, 2, 3, 4, 5]);
	expect(order(gql.desc)).toEqual([5, 4, 3, 2, 1]);
});

for (const limit of [-1, 1, 3]) {
	test(`sorts on the top level where limit = ${limit}`, async () => {
		const marker = `sort-top-limit-${limit}`;
		await seedArticles(marker);

		const expectedLength = limit === -1 ? 5 : limit;
		const filter = { title: { _starts_with: marker } };

		const asc = await api.request(readItems(collections.articles, { sort: ['title'], filter, limit }));
		const desc = await api.request(readItems(collections.articles, { sort: ['-title'], filter, limit }));

		expect(asc.length).toBe(expectedLength);
		expect(order(asc)).toEqual([1, 2, 3, 4, 5].slice(0, expectedLength));
		expect(order(desc)).toEqual([5, 4, 3, 2, 1].slice(0, expectedLength));
	});
}

test('sorts by a m2o field', async () => {
	const marker = 'sort-m2o';
	await seedArticles(marker, (n) => ({ author: { name: `${marker}-${n}` } }));

	const filter = { title: { _starts_with: marker } };

	const asc = await api.request(readItems(collections.articles, { sort: ['author.name'], filter }));
	const desc = await api.request(readItems(collections.articles, { sort: ['-author.name'], filter }));

	expect(order(asc)).toEqual([1, 2, 3, 4, 5]);
	expect(order(desc)).toEqual([5, 4, 3, 2, 1]);
});

test('sorts by an o2m field', async () => {
	const marker = 'sort-o2m';
	await seedArticles(marker, (n) => ({ links: [{ link: `${marker}-${n}` }] }));

	const filter = { title: { _starts_with: marker } };

	const asc = await api.request(readItems(collections.articles, { sort: ['links.link'], filter }));
	const desc = await api.request(readItems(collections.articles, { sort: ['-links.link'], filter }));

	expect(order(asc)).toEqual([1, 2, 3, 4, 5]);
	expect(order(desc)).toEqual([5, 4, 3, 2, 1]);
});

test('sorts by an o2m field with a limit applied', async () => {
	const marker = 'sort-o2m-limit';
	await seedArticles(marker, (n) => ({ links: [{ link: `${marker}-${n}` }] }));

	const filter = { title: { _starts_with: marker } };

	const asc = await api.request(readItems(collections.articles, { sort: ['links.link'], filter, limit: 3 }));
	const desc = await api.request(readItems(collections.articles, { sort: ['-links.link'], filter, limit: 3 }));

	// The limit applies to the root collection, not to the joined rows used for sorting
	expect(asc.length).toBe(3);
	expect(order(asc)).toEqual([1, 2, 3]);
	expect(order(desc)).toEqual([5, 4, 3]);
});

test('sorts by a m2m field', async () => {
	const marker = 'sort-m2m';
	await seedArticles(marker, (n) => ({ tags: [{ tags_id: { tag: `${marker}-${n}` } }] }));

	const filter = { title: { _starts_with: marker } };

	const asc = await api.request(readItems(collections.articles, { sort: ['tags.tags_id.tag'], filter }));
	const desc = await api.request(readItems(collections.articles, { sort: ['-tags.tags_id.tag'], filter }));

	expect(order(asc)).toEqual([1, 2, 3, 4, 5]);
	expect(order(desc)).toEqual([5, 4, 3, 2, 1]);
});

test('sorts by a function on a top level field', async () => {
	const marker = 'sort-fn-top';
	await seedArticles(marker, (n) => ({ release: `200${n}-01-01T00:00:00` }));

	const filter = { title: { _starts_with: marker } };

	const asc = await api.request(readItems(collections.articles, { sort: ['year(release)'], filter }));
	const desc = await api.request(readItems(collections.articles, { sort: ['-year(release)'], filter }));

	expect(order(asc)).toEqual([1, 2, 3, 4, 5]);
	expect(order(desc)).toEqual([5, 4, 3, 2, 1]);
});

test('sorts by a count function on an o2m field', async () => {
	const marker = 'sort-fn-count';

	for (const n of INSERT_ORDER) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${n}`,
				links: Array.from({ length: n }, (_, i) => ({ link: `${marker}-${n}-${i}` })),
			}),
		);
	}

	const filter = { title: { _starts_with: marker } };

	const asc = await api.request(readItems(collections.articles, { sort: ['count(links)'], filter }));
	const desc = await api.request(readItems(collections.articles, { sort: ['-count(links)'], filter }));

	expect(order(asc)).toEqual([1, 2, 3, 4, 5]);
	expect(order(desc)).toEqual([5, 4, 3, 2, 1]);
});

test('sorts nested o2m items independently of the root sort', async () => {
	const marker = 'sort-nested';

	const article = await api.request(
		createItem(collections.articles, {
			title: marker,
			links: INSERT_ORDER.map((n) => ({ link: `${marker}-${n}` })),
		}),
	);

	const [asc] = await api.request(
		readItems(collections.articles, {
			filter: { id: { _eq: article.id } },
			fields: ['links.link'],
			deep: { links: { _sort: ['link'] } },
		}),
	);

	const [desc] = await api.request(
		readItems(collections.articles, {
			filter: { id: { _eq: article.id } },
			fields: ['links.link'],
			deep: { links: { _sort: ['-link'] } },
		}),
	);

	expect(asc!.links.map((link: any) => Number(link.link.slice(-1)))).toEqual([1, 2, 3, 4, 5]);
	expect(desc!.links.map((link: any) => Number(link.link.slice(-1)))).toEqual([5, 4, 3, 2, 1]);
});
