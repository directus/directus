import { createDirectus, createItems, deleteItems, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
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
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(metadata, color)'],
		}),
	);

	expect(result).toEqual([
		{
			metadata_color_json: 'red',
			name: 'Alpha',
		},
		{
			metadata_color_json: 'blue',
			name: 'Beta',
		},
		{
			metadata_color_json: 'green',
			name: 'Gamma',
		},
		{
			metadata_color_json: 'yellow',
			name: 'Delta',
		},
		{
			metadata_color_json: 'orange',
			name: 'Epsilon',
		},
	]);
});

test('retrieves json field with nested object path', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(metadata, dimensions.width)', 'json(metadata, dimensions.height)'],
		}),
	);

	expect(result).toEqual([
		{
			name: 'Alpha',
			metadata_dimensions_width_json: 200,
			metadata_dimensions_height_json: 300,
		},
		{
			name: 'Beta',
			metadata_dimensions_width_json: 400,
			metadata_dimensions_height_json: null,
		},
		{
			name: 'Gamma',
			metadata_dimensions_width_json: 300,
			metadata_dimensions_height_json: -1,
		},
		{
			name: 'Delta',
			metadata_dimensions_width_json: 'Hello',
			metadata_dimensions_height_json: 'World',
		},
		{
			name: 'Epsilon',
			metadata_dimensions_width_json: null,
			metadata_dimensions_height_json: null,
		},
	]);
});

test('retrieves json field with array index path', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(metadata, tags[0])', 'json(metadata, tags[1])'],
		}),
	);

	expect(result).toEqual([
		{
			name: 'Alpha',
			metadata_tags_0_json: 'Electronics',
			metadata_tags_1_json: 'Home',
		},
		{
			name: 'Beta',
			metadata_tags_0_json: 'Home',
			metadata_tags_1_json: null,
		},
		{
			name: 'Gamma',
			metadata_tags_0_json: 'Furniture',
			metadata_tags_1_json: 'Sale',
		},
		{
			name: 'Delta',
			metadata_tags_0_json: null,
			metadata_tags_1_json: null,
		},
		{
			name: 'Epsilon',
			metadata_tags_0_json: null,
			metadata_tags_1_json: null,
		},
	]);
});

test('returns nested object as parsed JSON, not as string', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(metadata, dimensions)'],
		}),
	);

	expect(result).toEqual([
		{
			name: 'Alpha',
			metadata_dimensions_json: { width: 200, height: 300 },
		},
		{
			name: 'Beta',
			metadata_dimensions_json: { width: 400 },
		},
		{
			name: 'Gamma',
			metadata_dimensions_json: { width: 300, height: -1 },
		},
		{
			name: 'Delta',
			metadata_dimensions_json: { width: 'Hello', height: 'World' },
		},
		{ name: 'Epsilon', metadata_dimensions_json: null },
	]);
});

test('returns array as parsed JSON, not as string', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(metadata, tags)'],
		}),
	);

	expect(result).toEqual([
		{ name: 'Alpha', metadata_tags_json: ['Electronics', 'Home'] },
		{ name: 'Beta', metadata_tags_json: ['Home'] },
		{ name: 'Gamma', metadata_tags_json: ['Furniture', 'Sale'] },
		{ name: 'Delta', metadata_tags_json: null },
		{ name: 'Epsilon', metadata_tags_json: null },
	]);
});

test('returns array as parsed JSON, not as string', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(metadata, color)', 'json(metadata, settings)'],
		}),
	);

	expect(result).toEqual([
		{
			name: 'Alpha',
			metadata_color_json: 'red',
			metadata_settings_json: { theme: 'dark' },
		},
		{
			name: 'Beta',
			metadata_color_json: 'blue',
			metadata_settings_json: null,
		},
		{
			name: 'Gamma',
			metadata_color_json: 'green',
			metadata_settings_json: { theme: 'dark' },
		},
		{
			name: 'Delta',
			metadata_color_json: 'yellow',
			metadata_settings_json: { theme: null },
		},
		{
			name: 'Epsilon',
			metadata_color_json: 'orange',
			metadata_settings_json: null,
		},
	]);
});

test('handles null and missing values gracefully', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(metadata, notFound)', 'json(metadata, settings.notFound)'],
		}),
	);

	expect(result).toEqual([
		{
			name: 'Alpha',
			metadata_notFound_json: null,
			metadata_settings_notFound_json: null,
		},
		{
			name: 'Beta',
			metadata_notFound_json: null,
			metadata_settings_notFound_json: null,
		},
		{
			name: 'Gamma',
			metadata_notFound_json: null,
			metadata_settings_notFound_json: null,
		},
		{
			name: 'Delta',
			metadata_notFound_json: null,
			metadata_settings_notFound_json: null,
		},
		{
			name: 'Epsilon',
			metadata_notFound_json: null,
			metadata_settings_notFound_json: null,
		},
	]);
});

test('handles empty arrays', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'json(data, [0].test)'],
		}),
	);

	expect(result).toEqual([
		{ name: 'Alpha', data_0_test_json: 'foo' },
		{ name: 'Beta', data_0_test_json: 'bar' },
		{ name: 'Gamma', data_0_test_json: 'foo' },
		{ name: 'Delta', data_0_test_json: null },
		{ name: 'Epsilon', data_0_test_json: null },
	]);
});

test('json() aliasing', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'my_color'],
			alias: { my_color: 'json(metadata, color)' },
		}),
	);

	expect(result).toEqual([
		{ name: 'Alpha', my_color: 'red' },
		{ name: 'Beta', my_color: 'blue' },
		{ name: 'Gamma', my_color: 'green' },
		{ name: 'Delta', my_color: 'yellow' },
		{ name: 'Epsilon', my_color: 'orange' },
	]);
});

test('supports multiple json() aliases in one request', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'my_color', 'tags'],
			alias: { my_color: 'json(metadata, color)', tags: 'json(metadata, tags)' },
		}),
	);

	expect(result).toEqual([
		{ name: 'Alpha', my_color: 'red', tags: ['Electronics', 'Home'] },
		{ name: 'Beta', my_color: 'blue', tags: ['Home'] },
		{ name: 'Gamma', my_color: 'green', tags: ['Furniture', 'Sale'] },
		{ name: 'Delta', my_color: 'yellow', tags: null },
		{ name: 'Epsilon', my_color: 'orange', tags: null },
	]);
});

test('json alias returns null for missing path', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['name', 'wrong_path'],
			alias: { wrong_path: 'json(metadata, wrong_path)' },
		}),
	);

	expect(result).toEqual([
		{ name: 'Alpha', wrong_path: null },
		{ name: 'Beta', wrong_path: null },
		{ name: 'Gamma', wrong_path: null },
		{ name: 'Delta', wrong_path: null },
		{ name: 'Epsilon', wrong_path: null },
	]);
});

describe('json() sorting', () => {
	test('sorts asc by direct json() expression', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				sort: 'json(metadata, color)',
			}),
		);

		expect(result).toEqual([
			{ name: 'Beta' },
			{ name: 'Gamma' },
			{ name: 'Epsilon' },
			{ name: 'Alpha' },
			{ name: 'Delta' },
		]);
	});

	test('sorts desc by direct json() expression', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				sort: '-json(metadata, color)',
			}),
		);

		expect(result).toEqual([
			{ name: 'Delta' },
			{ name: 'Alpha' },
			{ name: 'Epsilon' },
			{ name: 'Gamma' },
			{ name: 'Beta' },
		]);
	});

	test('sorts asc by json() alias', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name', 'my_color'],
				alias: { my_color: 'json(metadata, color)' },
				sort: 'my_color',
			}),
		);

		expect(result).toEqual([
			{ name: 'Beta', my_color: 'blue' },
			{ name: 'Gamma', my_color: 'green' },
			{ name: 'Epsilon', my_color: 'orange' },
			{ name: 'Alpha', my_color: 'red' },
			{ name: 'Delta', my_color: 'yellow' },
		]);
	});
});

describe('Error handling', () => {
	test('returns error for non-json field', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name', 'json(name, invalid)'],
				}),
			),
		).rejects.toThrowError();
	});

	test('returns error for non-existent field', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name', 'json(nonexistent, invalid)'],
				}),
			),
		).rejects.toThrowError();
	});

	test('returns error for invalid json function syntax (missing path)', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name', 'json(metadata)'],
				}),
			),
		).rejects.toThrowError();
	});
});
