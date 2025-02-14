import { assertType, describe, test } from 'vitest';
import type { QuerySort } from '../src/types/query.js';
import type { CollectionA, TestSchema } from './schema.js';

describe('Test QuerySort and SortPath', () => {
	type CollectionASort = QuerySort<TestSchema, CollectionA>;

	test('error situations', () => {
		// all these should fail

		// @ts-expect-error
		assertType<CollectionASort>(undefined);
		// @ts-expect-error
		assertType<CollectionASort>({});
		// @ts-expect-error
		assertType<CollectionASort>(['not-a-field']);
		// @ts-expect-error
		assertType<CollectionASort>(['m2o.not-a-field']);
		// @ts-expect-error
		assertType<CollectionASort>(['m2m.id']);
		// @ts-expect-error
		assertType<CollectionASort>(['m2a.id']);
		// @ts-expect-error
		assertType<CollectionASort>([{ m2o: 'id' }]);
	});

	test('first level fields', () => {
		assertType<CollectionASort>([]);
		assertType<CollectionASort>(['-id']);
		assertType<CollectionASort>(['string_field']);
		assertType<CollectionASort>(['id', 'string_field']);
		assertType<CollectionASort>(['-id', '-string_field']);
		assertType<CollectionASort>(['-id', 'string_field']);
	});

	test('nested fields', () => {
		assertType<CollectionASort>(['string_field', 'm2o.id']);
		assertType<CollectionASort>(['-m2o.id']);
		assertType<CollectionASort>(['m2o.csv_field']);
		assertType<CollectionASort>(['id', '-m2o.id', 'string_field']);
	});
});
