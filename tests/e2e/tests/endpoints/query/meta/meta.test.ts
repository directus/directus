import { createDirectus, createItem, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { range } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

/** `meta` is not exposed through the SDK item readers, so these go through the REST endpoint directly. */
async function readWithMeta(collection: string, params: Record<string, unknown>) {
	const query = new URLSearchParams({ meta: '*' });

	for (const [key, value] of Object.entries(params)) {
		query.set(key, typeof value === 'string' ? value : JSON.stringify(value));
	}

	const response = await fetch(`http://localhost:${port}/items/${collection}?${query}`, {
		headers: { Authorization: 'Bearer admin' },
	});

	expect(response.status).toBe(200);

	return (await response.json()) as { data: any[]; meta: { filter_count: number; total_count: number } };
}

test('filter_count reports the number of items matching the filter', async () => {
	const marker = 'meta-filter-count';

	for (const i of range(2)) {
		await api.request(createItem(collections.articles, { title: `${marker}-${i}` }));
	}

	await api.request(createItem(collections.articles, { title: 'meta-other' }));

	const response = await readWithMeta(collections.articles, { filter: { title: { _starts_with: marker } } });

	expect(response.data.length).toBe(2);
	expect(response.meta.filter_count).toBe(2);
	expect(response.meta.total_count).toBeGreaterThanOrEqual(3);
});

test('filter_count is not inflated by a relational filter', async () => {
	const marker = 'meta-relational-count';

	for (const i of range(2)) {
		await api.request(
			createItem(collections.articles, {
				title: `${marker}-${i}`,
				links: range(2).map((l) => ({ link: `${marker}-${i}-${l}` })),
			}),
		);
	}

	const response = await readWithMeta(collections.articles, {
		filter: { title: { _starts_with: marker }, links: { link: { _starts_with: marker } } },
		fields: '*,links.*',
	});

	expect(response.data.length).toBe(2);
	expect(response.meta.filter_count).toBe(2);

	for (const item of response.data) {
		expect(item.links.length).toBe(2);
	}
});

test('a relational filter does not duplicate items in the result', async () => {
	const marker = 'join-dedup';

	await api.request(
		createItem(collections.articles, {
			title: marker,
			links: [{ link: `${marker}-1` }, { link: `${marker}-2` }],
		}),
	);

	// Filtering an article by a condition that matches both of its links must
	// still return the article once, not once per joined row
	const articles = await api.request(
		readItems(collections.articles, {
			filter: { _and: [{ title: { _eq: marker } }, { links: { article_id: { id: { _nnull: true } } } }] },
		}),
	);

	// The reverse direction fans out to two links, each of which is returned once
	const links = await api.request(
		readItems(collections.links, {
			filter: { _and: [{ link: { _starts_with: marker } }, { article_id: { links: { id: { _nnull: true } } } }] },
		}),
	);

	expect(articles.length).toBe(1);
	expect(links.length).toBe(2);
});
