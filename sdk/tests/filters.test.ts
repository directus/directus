import { describe, expectTypeOf, test } from 'vitest';
import { createDirectus, readItems, rest } from '../src/index.js';
import type { TestSchema } from './schema.js';

describe('Test QueryFilters', () => {
	test('issue #20633 resolving _and/_or filters', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());

		const withConditional = () =>
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

		const withoutConditional = () =>
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

		// make sure the output types are identical since filtering should not affect output
		type TypeWithConditional = Awaited<ReturnType<typeof withConditional>>;
		type TypeWithoutConditional = Awaited<ReturnType<typeof withoutConditional>>;

		const resultA: TypeWithConditional = [
			{
				id: 1,
				string_field: 'string',
				m2o: { id: 1 },
			},
		];

		expectTypeOf(resultA).toEqualTypeOf<TypeWithoutConditional>();

		const resultB: TypeWithoutConditional = [
			{
				id: 1,
				string_field: 'string',
				m2o: { id: 1 },
			},
		];

		expectTypeOf(resultB).toEqualTypeOf<TypeWithConditional>();
	});
});
