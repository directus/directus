import { createDirectus, createItems, deleteItems, graphql, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

beforeAll(async () => {
	await api.request(
		createItems(collections.articles, [
			{
				name: 'Alpha',
				metadata: {
					color: 'red',
					settings: {
						theme: 'dark',
					},
					dimensions: {
						width: 200,
						height: 300,
					},
					tags: ['Electronics', 'Home'],
				},
				data: [{ test: 'foo' }],
				author: {
					metadata: {
						color: 'blue',
					},
				},
			},
			{
				name: 'Beta',
				metadata: {
					color: 'blue',
					brand: null,
					level: 1,
					tags: ['Home'],
					dimensions: {
						width: 400,
					},
				},
				data: [{ test: 'bar' }],
				links: [
					{
						metadata: {
							color: 'red',
						},
					},
				],
			},
			{
				name: 'Gamma',
				metadata: {
					color: 'green',
					brand: 123,
					level: 2,
					settings: {
						theme: 'dark',
					},
					dimensions: {
						width: 300,
						height: -1,
					},
					tags: ['Furniture', 'Sale'],
				},
				data: [{ test: 'foo' }],
				author: {
					metadata: {
						color: 'blue',
					},
				},
			},
			{
				name: 'Delta',
				metadata: {
					color: 'yellow',
					brand: 'brand',
					level: 4,
					settings: {
						theme: null,
					},
					dimensions: {
						width: 'Hello',
						height: 'World',
					},
				},
				data: [{ test: null }],
				tags: [
					{
						tags_id: {
							metadata: {
								color: 'green',
							},
						},
					},
				],
			},
			{
				name: 'Epsilon',
				metadata: {
					color: 'orange',
					brand: 'My brand hey',
					level: 5,
				},
				data: [],
				tags: [
					{
						tags_id: {
							metadata: {
								color: 'orange',
							},
						},
					},
				],
			},
		]),
	);
});

afterAll(async () => {
	const items = await api.request(readItems(collections.articles, { fields: ['id'] }));

	if (items.length > 0)
		await api.request(
			deleteItems(
				collections.articles,
				items.map((item) => String(item.id!)),
			),
		);
});

test('json() field extraction', async () => {
	const result = await api.query(`
			query {
				${collections.articles}(filter: { metadata: { _json: { color: { _eq: "red" } } } }) {
					name
				}
			}
		`);

	expect(result[collections.articles].map((r) => r.name)).toEqual(['Alpha']);
});
