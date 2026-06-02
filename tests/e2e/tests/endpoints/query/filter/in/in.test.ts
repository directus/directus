import { createDirectus, createItems, deleteItems, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { beforeAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

beforeAll(async () => {
	const ids = await api.request(readItems(collections.articles));

	if (ids.length > 0) {
		await api.request(
			deleteItems(
				collections.articles,
				ids.map((id) => String(id.id)),
			),
		);
	}

	await api.request(
		createItems(collections.articles, [
			{
				title: 'Article 1',
				tags: 'a,b,c',
			},
			{
				title: 'Article 2',
				tags: 'b,c,d',
			},
			{
				title: 'Article 3',
				tags: 'c,d,e',
			},
		]),
	);
});

test(`_in operator`, async () => {
	const results = await api.request(
		readItems(collections.articles, {
			filter: {
				title: { _in: ['Article 1', 'Article 2'] },
			},
		}),
	);

	expect(results).toMatchObject([
		{
			title: 'Article 1',
		},
		{
			title: 'Article 2',
		},
	]);
});

test(`_nin operator`, async () => {
	const results = await api.request(
		readItems(collections.articles, {
			filter: {
				title: { _nin: ['Article 1', 'Article 2'] },
			},
		}),
	);

	expect(results).toMatchObject([
		{
			title: 'Article 3',
		},
	]);
});

test(`_in operator on csv`, async () => {
	let results = await api.request(
		readItems(collections.articles, {
			filter: {
				tags: { _in: ['c'] },
			},
		}),
	);

	expect(results).toMatchObject([
		{
			tags: ['a', 'b', 'c'],
		},
		{
			tags: ['b', 'c', 'd'],
		},
		{
			tags: ['c', 'd', 'e'],
		},
	]);

	results = await api.request(
		readItems(collections.articles, {
			filter: {
				tags: { _in: ['a', 'e'] },
			},
		}),
	);

	expect(results).toMatchObject([
		{
			tags: ['a', 'b', 'c'],
		},
		{
			tags: ['c', 'd', 'e'],
		},
	]);
});

test(`_nin operator on csv`, async () => {
	let results = await api.request(
		readItems(collections.articles, {
			filter: {
				tags: { _nin: ['c'] },
			},
		}),
	);

	expect(results).toMatchObject([]);

	results = await api.request(
		readItems(collections.articles, {
			filter: {
				tags: { _nin: ['a', 'e'] },
			},
		}),
	);

	expect(results).toMatchObject([
		{
			tags: ['b', 'c', 'd'],
		},
	]);
});
