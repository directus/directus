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
});
