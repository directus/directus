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

describe('Equality operators', () => {
	test('_eq: filters to exact match', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { color: { _eq: 'red' } } },
				},
			}),
		);

		expect(result).toEqual([
			{
				name: 'Alpha',
			},
		]);
	});

	test('_neq: excludes exact match', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { color: { _neq: 'red' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta', 'Gamma', 'Delta', 'Epsilon']);
	});
});

describe('Null operators', () => {
	test('_null: filters items where JSON key is absent', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _null: true } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Beta']);
	});

	test('_nnull: filters items where JSON key is present', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _nnull: true } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Gamma', 'Delta', 'Epsilon']);
	});
});

describe('Set operators', () => {
	test('_in: filters to items in set', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { color: { _in: ['red', 'blue'] } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Beta']);
	});

	test('_nin: filters to items not in set', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { color: { _nin: ['red', 'blue'] } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Gamma', 'Delta', 'Epsilon']);
	});
});

describe('String operators', () => {
	test('_contains: filters to items containing substring', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _contains: 'brand' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta', 'Epsilon']);
	});

	test('_ncontains: filters to items not containing substring', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _ncontains: 'M' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Gamma', 'Delta']);
	});

	test('_icontains: case-insensitive substring match', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _icontains: 'BRAND' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta', 'Epsilon']);
	});

	test('_starts_with: filters to items with matching prefix', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _starts_with: 'brand' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('_nstarts_with: filters to items not matching prefix', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _nstarts_with: 'brand' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Gamma', 'Epsilon']);
	});

	test('_istarts_with: case-insensitive prefix match', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _istarts_with: 'BRAND' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('_ends_with: filters to items with matching suffix', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _ends_with: 'and' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('_nends_with: filters to items not matching suffix', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _nends_with: 'and' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Gamma', 'Epsilon']);
	});

	test('_iends_with: case-insensitive suffix match', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _iends_with: 'AND' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});
});

describe('Numeric operators', () => {
	test('_gt: filters to items with value greater than threshold', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { level: { _gt: 3 } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta', 'Epsilon']);
	});

	test('_lt: filters to items with value less than threshold', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { level: { _lt: 5 } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta', 'Gamma', 'Delta']);
	});

	test('_gte: filters to items with value greater than or equal to threshold', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { level: { _gte: 5 } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Epsilon']);
	});

	test('_lte: filters to items with value less than or equal to threshold', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { level: { _lte: 3 } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta', 'Gamma']);
	});
});

describe('Range operators', () => {
	test('_between (string): filters to items with string value in inclusive range', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { color: { _between: ['blue', 'red'] } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Beta', 'Gamma', 'Epsilon']);
	});

	test('_nbetween (string): filters to items with string value outside inclusive range', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { color: { _nbetween: ['blue', 'red'] } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('_between (numeric): filters to items with numeric value in inclusive range', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { level: { _between: [2, 4] } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Gamma', 'Delta']);
	});

	test('_nbetween (numeric): filters to items with numeric value outside inclusive range', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { level: { _nbetween: [2, 4] } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta', 'Epsilon']);
	});
});

describe('Multi-segment dot path', () => {
	test('filters on nested object path settings.theme', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { 'settings.theme': { _eq: 'dark' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Gamma']);
	});

	test('_null on nested path returns item with missing nested key', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { 'settings.theme': { _null: true } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta', 'Delta', 'Epsilon']);
	});
});

describe('Array index path', () => {
	test('filters on first array element tags[0] = electronics', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { 'tags[0]': { _eq: 'Electronics' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha']);
	});

	test('filters on first array element tags[0] = home', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { 'tags[0]': { _eq: 'Home' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta']);
	});

	test('filters on second array element tags[1] = sale', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { 'tags[1]': { _eq: 'Sale' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Gamma']);
	});

	test('filters on second array element tags[1] = new', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { 'tags[1]': { _eq: 'Home' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha']);
	});
});

describe('Root array index path', () => {
	test('filters on root array element[0].test = foo', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					data: { _json: { '[0].test': { _eq: 'foo' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Gamma']);
	});

	test('filters on root array element [0].test = bar', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					data: { _json: { '[0].test': { _eq: 'bar' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta']);
	});

	test('_null: false matches items where [0].test is present', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					data: { _json: { '[0].test': { _null: false } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
	});

	test('_null: true matches items where [0].test is absent', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					data: { _json: { '[0].test': { _null: true } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta', 'Epsilon']);
	});
});

describe('Inline _or/_and inside _json', () => {
	test('_or: returns items matching either path condition', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'blue' } }] } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Beta']);
	});

	test('_or: returns items matching either of two different paths', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { _or: [{ color: { _eq: 'red' } }, { level: { _gt: 4 } }] } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Epsilon']);
	});

	test('_or: unions three branches across different paths', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: {
						_json: { _or: [{ color: { _eq: 'red' } }, { brand: { _eq: 'brand' } }, { level: { _gt: 4 } }] },
					},
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Delta', 'Epsilon']);
	});

	test('_and: explicit AND semantics matches both conditions', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: {
						_json: { _and: [{ color: { _eq: 'yellow' } }, { brand: { _eq: 'brand' } }] },
					},
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('_and: narrows result with three conditions across different paths', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: {
						_json: {
							_and: [{ brand: { _contains: 'brand' } }, { level: { _lte: 5 } }, { color: { _neq: 'yellow' } }],
						},
					},
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Epsilon']);
	});

	test('_or sibling to a regular path condition combines as AND', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: {
						_json: { brand: { _contains: 'brand' }, _or: [{ color: { _eq: 'orange' } }, { color: { _eq: 'green' } }] },
					},
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Epsilon']);
	});

	test('_or containing a nested _and branch', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: {
						_json: {
							_or: [{ _and: [{ color: { _eq: 'yellow' } }, { level: { _lt: 5 } }] }, { brand: { _eq: 'brand' } }],
						},
					},
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('_and containing a nested _or branch', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: {
						_json: {
							_and: [{ _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'blue' } }] }, { level: { _lte: 5 } }],
						},
					},
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta']);
	});
});

describe('Multiple operators in single _json', () => {
	test('two path conditions in one _json object both must match (AND semantics)', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { color: { _eq: 'yellow' }, brand: { _nnull: true } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('three path conditions in one _json object narrow result set', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					metadata: { _json: { brand: { _starts_with: 'brand' }, level: { _gt: 3 }, color: { _neq: 'black' } } },
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});
});

describe('Logical combinations', () => {
	test('_and: combines two _json conditions', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					_and: [
						{ metadata: { _json: { color: { _eq: 'yellow' } } } },
						{ metadata: { _json: { brand: { _eq: 'brand' } } } },
					],
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});

	test('_or: unions two _json conditions', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					_or: [
						{ metadata: { _json: { color: { _eq: 'red' } } } },
						{ metadata: { _json: { color: { _eq: 'blue' } } } },
					],
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Beta']);
	});

	test('_and mixing _json filter with regular field filter', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: {
					_and: [{ metadata: { _json: { brand: { _starts_with: 'brand' } } } }, { name: { _neq: 'Alpha' } }],
				},
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});
});

describe('Relational filters', () => {
	test('filters m2o', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: { author: { metadata: { _json: { color: { _eq: 'blue' } } } } },
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Alpha', 'Gamma']);
	});

	test('filters o2m', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: { links: { metadata: { _json: { color: { _eq: 'red' } } } } },
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Beta']);
	});

	test('filters m2m', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: { tags: { tags_id: { metadata: { _json: { color: { _eq: 'green' } } } } } },
			}),
		);

		expect(result.map((r) => r.name)).toEqual(['Delta']);
	});
});

describe('Boundary and zero-result filters', () => {
	test('filter matching no items returns empty result set', async () => {
		const result = await api.request(
			readItems(collections.articles, {
				fields: ['name'],
				filter: { metadata: { _json: { color: { _eq: 'purple' } } } },
			}),
		);

		expect(result).toEqual([]);
	});
});

describe('Error cases', () => {
	test('returns 400 when _json is used on a non-JSON field', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { name: { _json: { path: { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 for unsupported wildcard path expression', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { 'items[*]': { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when JSON path depth exceeds maximum (>10 segments)', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { 'a.b.c.d.e.f.g.h.i.j.k': { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _json value is a primitive instead of an object', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: 'not-an-object' } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _json inner filter is a primitive instead of an operator object', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { color: 'not-an-object' } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _or inside _json is not an array', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { _or: { color: { _eq: 'red' } } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 for $ root reference in JSON path', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { '$.color': { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 for @ root reference in JSON path', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { '@.color': { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 for ? root reference in JSON path', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { '?.color': { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 for empty bracket subscript [] in JSON path', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { 'items[]': { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 for empty string JSON path key', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { '': { _eq: 'val' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _in inside _json receives a string instead of an array', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { color: { _in: 'red' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _in inside _json receives an empty array', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { color: { _in: [] } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _between inside _json receives a non-array value', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { level: { _between: 5 } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _null inside _json receives a non-boolean value', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { color: { _null: 'yes' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _eq inside _json receives an empty string', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { color: { _eq: '' } } } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _json value is null instead of an object', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: null } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when _or inside _json contains a null entry', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: [null] } },
				}),
			),
		).rejects.toThrowError();
	});

	test('returns 400 when a json path key is nested inside another json path key', async () => {
		await expect(
			api.request(
				readItems(collections.articles, {
					fields: ['name'],
					filter: { metadata: { _json: { 'a.b': { 'c[0]': { _eq: 1 } } } } },
				}),
			),
		).rejects.toThrowError();
	});
});
