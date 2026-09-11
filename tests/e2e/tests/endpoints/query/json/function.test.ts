import { createDirectus, createItem, readItem, readItems, rest, staticToken, updateItem } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { seedFunctionProducts } from './seed.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

await seedFunctionProducts(api, collections);

/** Reads all four products by name, so that index 0 is Alpha, 1 Beta, 2 Gamma, 3 Zeta. */
function read(query: Record<string, unknown>) {
	return api.request<any[]>(readItems(collections.products, { sort: ['name'], ...query } as any));
}

test('extracts a scalar at a top level path', async () => {
	const result = await read({ fields: ['id', 'name', 'json(metadata, color)'] });

	expect(result.map((item) => item.metadata_color_json)).toEqual(['red', 'blue', 'green', 'black']);
});

test('extracts scalars at a nested dot path', async () => {
	const result = await read({
		fields: ['name', 'json(metadata, dimensions.width)', 'json(metadata, dimensions.height)'],
	});

	// Some databases hand back JSON numbers as strings
	expect(Number(result[0].metadata_dimensions_width_json)).toBe(10);
	expect(Number(result[0].metadata_dimensions_height_json)).toBe(20);
	expect(result[3].metadata_dimensions_width_json).toBeNull();
});

test('extracts elements at an array index path', async () => {
	const result = await read({ fields: ['name', 'json(metadata, tags[0])', 'json(metadata, tags[1])'] });

	expect(result[0].metadata_tags_0_json).toBe('electronics');
	expect(result[0].metadata_tags_1_json).toBe('premium');
});

test('extracts a value nested under an array index', async () => {
	const result = await read({
		fields: ['name', 'json(metadata, variants[0].sku)', 'json(metadata, variants[0].price)'],
	});

	expect(result[0].metadata_variants_0_sku_json).toBe('SKU-001');
	expect(Number(result[0].metadata_variants_0_price_json)).toBeCloseTo(99.99, 2);
});

test('returns an object path as parsed json rather than a string', async () => {
	const result = await read({ fields: ['name', 'json(metadata, dimensions)'] });

	expect(result[0].metadata_dimensions_json).toEqual({ width: 10, height: 20, depth: 5 });
});

test('returns an array path as parsed json rather than a string', async () => {
	const result = await read({ fields: ['name', 'json(metadata, tags)'] });

	expect(result[0].metadata_tags_json).toEqual(['electronics', 'premium', 'new']);
	expect(result[3].metadata_tags_json).toEqual([]);
});

test('returns an array of objects as parsed json', async () => {
	const result = await read({ fields: ['name', 'json(metadata, variants)'] });

	expect(result[0].metadata_variants_json).toEqual([
		{ sku: 'SKU-001', price: 99.99, available: true },
		{ sku: 'SKU-002', price: 149.99, available: false },
	]);
});

test('extracts from two different json columns in one request', async () => {
	const result = await read({ fields: ['name', 'json(metadata, color)', 'json(data, theme)'] });

	expect(result[0].metadata_color_json).toBe('red');
	expect(result[0].data_theme_json).toBe('dark');
});

test('returns null for a missing key and for a null column', async () => {
	const result = await read({ fields: ['name', 'json(metadata, brand)', 'json(data, theme)'] });

	// Zeta has no brand and a null data column
	expect(result[3].metadata_brand_json).toBeNull();
	expect(result[3].data_theme_json).toBeNull();
});

test('returns null for an index past the end of an array', async () => {
	const result = await read({ fields: ['name', 'json(metadata, variants[0].sku)'] });

	// Gamma stores an empty variants array
	expect(result[2].metadata_variants_0_sku_json).toBeNull();
});

test('combines json extraction with regular fields', async () => {
	const result = await read({ fields: ['id', 'name', 'json(metadata, color)'] });

	expect(result[0]).toEqual({
		id: expect.anything(),
		name: 'Alpha',
		metadata_color_json: 'red',
	});
});

test('uses a custom alias for a json path', async () => {
	const result = await read({
		fields: ['name', 'color', 'width', 'first_tag', 'first_sku'],
		alias: {
			color: 'json(metadata, color)',
			width: 'json(metadata, dimensions.width)',
			first_tag: 'json(metadata, tags[0])',
			first_sku: 'json(metadata, variants[0].sku)',
		},
	});

	expect(result[0]).toEqual({
		name: 'Alpha',
		color: 'red',
		width: expect.toSatisfy((value: unknown) => Number(value) === 10),
		first_tag: 'electronics',
		first_sku: 'SKU-001',
	});
});

test('a json alias returns null for a missing path and parsed json for an object', async () => {
	const result = await read({
		fields: ['name', 'brand', 'dimensions'],
		alias: { brand: 'json(metadata, brand)', dimensions: 'json(metadata, dimensions)' },
	});

	expect(result[0].dimensions).toEqual({ width: 10, height: 20, depth: 5 });
	expect(result[3].brand).toBeNull();
});

test('a json alias is included alongside a wildcard field selection', async () => {
	const result = await read({ fields: ['*', 'color'], alias: { color: 'json(metadata, color)' } });

	expect(result[0].name).toBe('Alpha');
	expect(result[0].color).toBe('red');
});

for (const [description, sort, expected] of [
	['ascending by a json() expression', 'json(metadata, color)', ['black', 'blue', 'green', 'red']],
	['descending by a json() expression', '-json(metadata, color)', ['red', 'green', 'blue', 'black']],
	['ascending by a json() alias', 'color', ['black', 'blue', 'green', 'red']],
	['descending by a json() alias', '-color', ['red', 'green', 'blue', 'black']],
] as const) {
	test(`sorts ${description}`, async () => {
		const result = await api.request<any[]>(
			readItems(collections.products, {
				fields: ['color'],
				alias: { color: 'json(metadata, color)' },
				sort: [sort],
			} as any),
		);

		expect(result.map((item) => item.color)).toEqual(expected);
	});
}

test('sorts by a json() expression with a dotted path', async () => {
	const result = await api.request<any[]>(
		readItems(collections.products, {
			fields: ['width'],
			alias: { width: 'json(metadata, dimensions.width)' },
			sort: ['json(metadata, dimensions.width)'],
		} as any),
	);

	// Where null sorts differs per database, so only the present values are compared
	const widths = result
		.map((item) => item.width)
		.filter((width) => width !== null)
		.map(Number);

	expect(widths).toEqual([10, 12, 15]);
});

test('extracts json when reading a single item', async () => {
	const [alpha] = await read({ fields: ['id'], filter: { name: { _eq: 'Alpha' } } });

	const result = await api.request<any>(
		readItem(collections.products, alpha.id, {
			fields: ['name', 'json(metadata, color)', 'shade'],
			alias: { shade: 'json(metadata, color)' },
		} as any),
	);

	expect(result).toEqual({ name: 'Alpha', metadata_color_json: 'red', shade: 'red' });
});

test('extracts json from a create response', async () => {
	const result = await api.request<any>(
		createItem(
			collections.products,
			{ name: 'Created', metadata: { color: 'purple' } } as any,
			{ fields: ['name', 'json(metadata, color)'] } as any,
		),
	);

	expect(result).toEqual({ name: 'Created', metadata_color_json: 'purple' });
});

test('extracts json from an update response', async () => {
	const created = await api.request<any>(
		createItem(collections.products, { name: 'Updated', metadata: { color: 'purple' } } as any),
	);

	const result = await api.request<any>(
		updateItem(
			collections.products,
			created.id,
			{ metadata: { color: 'orange' } } as any,
			{
				fields: ['name', 'json(metadata, color)'],
			} as any,
		),
	);

	expect(result).toEqual({ name: 'Updated', metadata_color_json: 'orange' });
});

const ERROR_CASES: { description: string; query: Record<string, unknown>; code?: string }[] = [
	{ description: 'json() on a field that is not json', query: { fields: ['json(name, color)'] } },
	// A missing field is reported as a permission failure rather than an invalid query
	{
		description: 'json() on a field that does not exist',
		query: { fields: ['json(nope, color)'] },
		code: 'FORBIDDEN',
	},
	{ description: 'json() without a path argument', query: { fields: ['json(metadata)'] } },
	{
		description: 'an alias key containing a period',
		query: { fields: ['my.color'], alias: { 'my.color': 'json(metadata, color)' } },
	},
	{
		description: 'an alias value with a period that is not a json() call',
		query: { fields: ['color'], alias: { color: 'metadata.color' } },
	},
	{
		description: 'a json() alias without a path argument',
		query: { fields: ['color'], alias: { color: 'json(metadata)' } },
	},
	{
		description: 'a json() alias on a field that is not json',
		query: { fields: ['color'], alias: { color: 'json(name, color)' } },
	},
];

for (const { description, query, code } of ERROR_CASES) {
	test(`rejects ${description}`, async () => {
		await expect(api.request(readItems(collections.products, query as any))).rejects.toMatchObject({
			errors: [{ extensions: { code: code ?? expect.stringMatching(/INVALID_QUERY|INVALID_PAYLOAD/) } }],
		});
	});
}
