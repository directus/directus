import { describe, expectTypeOf, test } from 'vitest';
import { createDirectus, readItems, rest } from '../src/index.js';
import type { TestSchema } from './schema.js';

describe('Test QueryFilters', () => {
	test('resolving _and/_or filters (issue #20633)', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		const _withConditional = () =>
			client.request(
				readItems('collection_a', {
					fields: [
						'id',
						'string_field',
						{
							m2o: ['id'],
						},
					],
					filter: {
						_and: [{ id: { _eq: 1 } }],
					},
				}),
			);

		const _withoutConditional = () =>
			client.request(
				readItems('collection_a', {
					fields: [
						'id',
						'string_field',
						{
							m2o: ['id'],
						},
					],
					filter: { id: { _eq: 1 } },
				}),
			);

		type TypeWithConditional = Awaited<ReturnType<typeof _withConditional>>;
		type TypeWithoutConditional = Awaited<ReturnType<typeof _withoutConditional>>;

		const resultA: TypeWithConditional = [
			{
				id: 1,
				string_field: 'string',
				m2o: { id: 1 },
			},
		];

		const resultB: TypeWithoutConditional = [
			{
				id: 1,
				string_field: 'string',
				m2o: { id: 1 },
			},
		];

		// make sure the output types are identical since filtering should not affect output types
		expectTypeOf(resultA).toEqualTypeOf<TypeWithoutConditional>();
		expectTypeOf(resultB).toEqualTypeOf<TypeWithConditional>();
	});

	test('date and time fields support temporal filter operators', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		// date fields should accept comparison and range operators
		const _dateFilters = () =>
			client.request(
				readItems('collection_c', {
					filter: {
						date_field: {
							_gt: '2024-01-01',
							_lt: '2024-12-31',
							_between: ['2024-01-01', '2024-12-31'],
							_eq: '2024-06-15',
						},
					},
				}),
			);

		// time fields should accept comparison and range operators
		const _timeFilters = () =>
			client.request(
				readItems('collection_c', {
					filter: {
						time_field: {
							_gte: '09:00:00',
							_lte: '17:00:00',
							_nbetween: ['00:00:00', '06:00:00'],
							_eq: '12:00:00',
						},
					},
				}),
			);

		// datetime fields should still work
		const _datetimeFilters = () =>
			client.request(
				readItems('collection_c', {
					filter: {
						dt_field: {
							_eq: '2024-01-01T00:00:00',
							_gt: '2024-01-01T00:00:00',
							_between: ['2024-01-01T00:00:00', '2024-12-31T23:59:59'],
						},
					},
				}),
			);

		// ensure no type errors (the test passes if it compiles)
		expectTypeOf(_dateFilters).toBeFunction();
		expectTypeOf(_timeFilters).toBeFunction();
		expectTypeOf(_datetimeFilters).toBeFunction();
	});

	test('nullable and non nullable filters', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		const _nullable = () =>
			client.request(
				readItems('collection_c', {
					filter: {
						nullable: {
							_null: true,
							_nnull: false,
						},
					},
				}),
			);

		const _non_nullable = () =>
			client.request(
				readItems('collection_c', {
					filter: {
						non_nullable: {
							// @ts-expect-error
							_null: false,
						},
					},
				}),
			);

		expectTypeOf(_nullable).toBeFunction();
		expectTypeOf(_non_nullable).toBeFunction();
	});

	test('_json filter operator', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		// single path equality
		const _jsonEq = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_json: { color: { _eq: 'red' } },
						},
					},
				}),
			);

		// multiple paths in one filter
		const _jsonMultiple = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_json: {
								color: { _eq: 'red' },
								size: { _in: ['small', 'medium'] },
							},
						},
					},
				}),
			);

		// null check on a json path value
		const _jsonNull = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_json: { color: { _null: true } },
						},
					},
				}),
			);

		// combined with _null on the field itself
		const _jsonWithFieldNull = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_null: true,
							_json: { color: { _eq: 'blue' } },
						},
					},
				}),
			);

		// _json value must be a record — a plain string is not valid
		const _jsonBadValue = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							// @ts-expect-error
							_json: 'color',
						},
					},
				}),
			);

		expectTypeOf(_jsonEq).toBeFunction();
		expectTypeOf(_jsonMultiple).toBeFunction();
		expectTypeOf(_jsonNull).toBeFunction();
		expectTypeOf(_jsonWithFieldNull).toBeFunction();
		expectTypeOf(_jsonBadValue).toBeFunction();
	});

	test('_json filter with complex path strings and varied operators', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		// dot-notation nested path
		const _dotPath = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_json: { 'address.city': { _eq: 'London' } },
						},
					},
				}),
			);

		// array-index notation path
		const _arrayPath = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_json: { 'tags[0]': { _eq: 'sports' } },
						},
					},
				}),
			);

		// multiple operators across different paths, including _in and _neq
		const _mixedOperators = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_json: {
								color: { _eq: 'red' },
								status: { _neq: 'inactive' },
								category: { _in: ['a', 'b', 'c'] },
								archived: { _nin: [true, false] },
							},
						},
					},
				}),
			);

		// _nnull to assert a path exists
		const _pathExists = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						json_field: {
							_json: { 'metadata.thumbnail': { _nnull: true } },
						},
					},
				}),
			);

		expectTypeOf(_dotPath).toBeFunction();
		expectTypeOf(_arrayPath).toBeFunction();
		expectTypeOf(_mixedOperators).toBeFunction();
		expectTypeOf(_pathExists).toBeFunction();
	});

	test('_json filter inside _and/_or logical operators', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		// _and combining two _json conditions on the same field
		const _andJson = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						_and: [
							{ json_field: { _json: { color: { _eq: 'red' } } } },
							{ json_field: { _json: { size: { _eq: 'large' } } } },
						],
					},
				}),
			);

		// _or between a _json condition and a field-level _null check
		const _orJsonAndNull = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						_or: [{ json_field: { _json: { status: { _eq: 'active' } } } }, { json_field: { _null: true } }],
					},
				}),
			);

		// _json mixed with non-json field filters inside _and
		const _andMixed = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						_and: [{ id: { _gt: 5 } }, { json_field: { _json: { color: { _in: ['red', 'blue'] } } } }],
					},
				}),
			);

		// nested _and inside _or wrapping _json
		const _nestedLogical = () =>
			client.request(
				readItems('collection_b', {
					filter: {
						_or: [
							{
								_and: [
									{ json_field: { _json: { color: { _eq: 'red' } } } },
									{ json_field: { _json: { size: { _eq: 'small' } } } },
								],
							},
							{ json_field: { _json: { featured: { _eq: true } } } },
						],
					},
				}),
			);

		expectTypeOf(_andJson).toBeFunction();
		expectTypeOf(_orJsonAndNull).toBeFunction();
		expectTypeOf(_andMixed).toBeFunction();
		expectTypeOf(_nestedLogical).toBeFunction();
	});

	test('_json filter through a relational field', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		// filter collection_a items via m2o → collection_b.json_field
		const _relationalJson = () =>
			client.request(
				readItems('collection_a', {
					filter: {
						m2o: {
							json_field: { _json: { color: { _eq: 'red' } } },
						},
					},
				}),
			);

		// _json on related field combined with _and at the top level
		const _relationalJsonAndId = () =>
			client.request(
				readItems('collection_a', {
					filter: {
						_and: [{ id: { _gt: 10 } }, { m2o: { json_field: { _json: { status: { _eq: 'active' } } } } }],
					},
				}),
			);

		// _or between a direct field and a relational _json condition
		const _relationalJsonOr = () =>
			client.request(
				readItems('collection_a', {
					filter: {
						_or: [{ string_field: { _eq: 'hello' } }, { m2o: { json_field: { _json: { theme: { _eq: 'dark' } } } } }],
					},
				}),
			);

		expectTypeOf(_relationalJson).toBeFunction();
		expectTypeOf(_relationalJsonAndId).toBeFunction();
		expectTypeOf(_relationalJsonOr).toBeFunction();
	});
});
