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
});
