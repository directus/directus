import { assertType, describe, test } from 'vitest';
import type { QueryFields } from '../src/types/fields.js';
import type { CollectionA, CollectionB, CollectionC, TestSchema } from './schema.js';

describe('Test QueryFields', () => {
	type CollectionAFields = QueryFields<TestSchema, CollectionA>;
	type CollectionBFields = QueryFields<TestSchema, CollectionB>;
	type CollectionCFields = QueryFields<TestSchema, CollectionC>;

	test('error situations', () => {
		// all these should fail

		// @ts-expect-error
		assertType<CollectionAFields>(undefined);
		// @ts-expect-error
		assertType<CollectionAFields>({});
		// @ts-expect-error
		assertType<CollectionAFields>(['not-a-field']);
		// @ts-expect-error
		assertType<CollectionAFields>([{ m2o: ['not-a-field'] }]);
		// @ts-expect-error
		assertType<CollectionAFields>([{ m2m: [{ not_a_field: ['not-a-field'] }] }]);
	});

	test('first level fields', () => {
		assertType<CollectionAFields>([]);
		assertType<CollectionAFields>(['*']);
		assertType<CollectionAFields>(['id', 'string_field']);
		assertType<CollectionAFields>(['*', { m2o: ['*'] }]);
	});

	test('function fields', () => {
		// array functions
		assertType<CollectionAFields>(['count(m2m)', 'count(o2m)', 'count(m2a)']);
		assertType<CollectionAFields>(['*', { m2o: ['count(json_field)', 'count(csv_field)'] }]);

		// date functions
		assertType<CollectionCFields>([
			'hour(dt_field)',
			'minute(dt_field)',
			'second(dt_field)',
			'day(dt_field)',
			'week(dt_field)',
			'weekday(dt_field)',
			'month(dt_field)',
			'year(dt_field)',
		]);
	});

	test('json function fields', () => {
		// valid: json field with a simple path
		assertType<CollectionBFields>(['json(json_field, color)']);

		// valid: json field with a nested dot-notation path
		assertType<CollectionBFields>(['json(json_field, address.city)']);

		// valid: multiple json() selections alongside regular fields
		assertType<CollectionBFields>(['id', 'json(json_field, color)', 'json(json_field, size)']);

		// valid: json() alongside count() on the same field
		assertType<CollectionBFields>(['count(json_field)', 'json(json_field, color)']);

		// valid: json() via a relational field on collection_a
		assertType<CollectionAFields>(['id', { m2o: ['json(json_field, color)'] }]);

		// invalid: non-json field as first argument
		// @ts-expect-error
		assertType<CollectionBFields>(['json(id, color)']);

		// invalid: csv field is not a json field
		// @ts-expect-error
		assertType<CollectionBFields>(['json(csv_field, color)']);
	});

	test('nested fields', () => {
		assertType<CollectionAFields>([
			{
				m2a: ['collection', { item: { collection_b: ['id', 'json_field'], collection_c: ['*'] } }],
				m2m: [{ collection_b_id: ['*'] }],
				m2o: ['id', 'csv_field'],
			},
		]);
	});
});
