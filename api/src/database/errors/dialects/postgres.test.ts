import { ValueOutOfRangeError } from '@directus/errors';
import type { Item } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { extractError } from './postgres.js';
import type { PostgresError } from './types.js';

describe('postgres extractError', () => {
	test('does not attribute a numeric overflow (22003) to an unrelated column', () => {
		// Postgres 22003 doesn't name the offending column; Knex surfaces the failing
		// SQL in the message, so the old logic wrongly took the first quoted column.
		const error = {
			code: '22003',
			message:
				'insert into "inventory" ("body_type_id", "id", "retail_price", "stock_number") values ($1, $2, $3, $4) returning "id" - numeric field overflow',
			length: 0,
			detail: '',
			schema: 'public',
			table: 'inventory',
		} as PostgresError;

		const data: Partial<Item> = {
			body_type_id: 'f89834b4-682f-41f1-b48f-2375c5cdd618',
			retail_price: 224266,
			stock_number: 'TEST01',
		};

		const result = extractError(error, data);

		expect(result).toBeInstanceOf(ValueOutOfRangeError);

		const { collection, field, value } = (result as InstanceType<typeof ValueOutOfRangeError>).extensions;

		// Collection is still reliably derived, but the field must NOT be guessed
		// (previously this misattributed the overflow to the m2o uuid `body_type_id`).
		expect(collection).toBe('inventory');
		expect(field).toBeNull();
		expect(value).toBeNull();
	});
});
