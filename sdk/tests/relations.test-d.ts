import type {
	CollectionA,
	CollectionAB_Any,
	CollectionAB_Many,
	CollectionB,
	CollectionC,
	TestSchema,
} from './schema.js';
import { createDirectus, readItems, rest } from '../src/index.js';
import { describe, expectTypeOf, test } from 'vitest';

describe('Test relational return typing (issue #23545)', () => {
	test('Flat relational field return type', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		const _itemFlatRelations = () =>
			client.request(
				readItems('collection_a', {
					fields: ['m2o', 'o2m', 'm2m', 'm2a'],
				}),
			);

		type Item = Awaited<ReturnType<typeof _itemFlatRelations>>[0];

		const result: Item = {
			m2o: 123,
			o2m: [123],
			m2m: [123],
			m2a: [123],
		};

		type Expected = {
			m2o: Exclude<CollectionA['m2o'], CollectionB>;
			o2m: Exclude<CollectionA['o2m'], CollectionC[]>;
			m2m: Exclude<CollectionA['m2m'], CollectionAB_Many[]>;
			m2a: Exclude<CollectionA['m2a'], CollectionAB_Any[]>;
		};

		expectTypeOf(result).toEqualTypeOf<Expected>();
	});

	test('Nested relational ID #23545', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		const _itemNestedRelations = () =>
			client.request(
				readItems('collection_a', {
					fields: [
						{
							m2o: ['id'],
							o2m: ['id'],
							m2m: ['id'],
							m2a: ['id'],
						},
					],
				}),
			);

		type Item = Awaited<ReturnType<typeof _itemNestedRelations>>[0];

		const result: Item = {
			m2o: {
				id: 123,
			},
			o2m: [
				{
					id: 123,
				},
			],
			m2m: [
				{
					id: 123,
				},
			],
			m2a: [
				{
					id: 123,
				},
			],
		};

		type Expected = {
			m2o: Pick<CollectionB, 'id'>;
			o2m: Pick<CollectionC, 'id'>[] | null;
			m2m: Pick<CollectionAB_Many, 'id'>[] | null;
			m2a: Pick<CollectionAB_Any, 'id'>[] | null;
		};

		expectTypeOf(result).toEqualTypeOf<Expected>();
	});
});
