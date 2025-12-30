import { validateKeys } from './validate-keys.js';
import { SchemaBuilder } from '@directus/schema-builder';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const schema = new SchemaBuilder()
	.collection('pk_integer', (c) => {
		c.field('id').integer().primary();
	})
	.collection('pk_uuid', (c) => {
		c.field('id').uuid().primary();
	})
	.build();

describe('validate keys', () => {
	describe('of integer type', () => {
		it('Throws an error when provided with an invalid integer key', () => {
			expect(() => validateKeys(schema, 'pk_integer', 'id', 'invalid')).toThrowError();
			expect(() => validateKeys(schema, 'pk_integer', 'id', NaN)).toThrowError();
		});

		it('Throws an error when provided with an array containing an invalid integer key', () => {
			expect(() => validateKeys(schema, 'pk_integer', 'id', [111, 'invalid', 222])).toThrowError();
			expect(() => validateKeys(schema, 'pk_integer', 'id', [555, NaN, 666])).toThrowError();
		});

		it('Does not throw an error when provided with a valid integer key', () => {
			expect(() => validateKeys(schema, 'pk_integer', 'id', 111)).not.toThrowError();
			expect(() => validateKeys(schema, 'pk_integer', 'id', '222')).not.toThrowError();
		});

		it('Does not throw an error when provided with an array of valid integer keys', () => {
			expect(() => validateKeys(schema, 'pk_integer', 'id', [111, 222, 333])).not.toThrowError();
			expect(() => validateKeys(schema, 'pk_integer', 'id', ['444', '555', '666'])).not.toThrowError();
		});
	});

	describe('of uuid type', () => {
		it('Throws an error when provided with an invalid uuid key', () => {
			expect(() => validateKeys(schema, 'pk_uuid', 'id', 'fakeuuid-62d9-434d-a7c7-878c8376782e')).toThrowError();
			expect(() => validateKeys(schema, 'pk_uuid', 'id', 'invalid')).toThrowError();
			expect(() => validateKeys(schema, 'pk_uuid', 'id', NaN)).toThrowError();
			expect(() => validateKeys(schema, 'pk_uuid', 'id', 111)).toThrowError();
		});

		it('Throws an error when provided with an array containing an invalid uuid key', () => {
			expect(() =>
				validateKeys(schema, 'pk_uuid', 'id', [randomUUID(), 'fakeuuid-62d9-434d-a7c7-878c8376782e', randomUUID()]),
			).toThrowError();

			expect(() => validateKeys(schema, 'pk_uuid', 'id', [randomUUID(), 'invalid', randomUUID()])).toThrowError();
			expect(() => validateKeys(schema, 'pk_uuid', 'id', [randomUUID(), NaN, randomUUID()])).toThrowError();
			expect(() => validateKeys(schema, 'pk_uuid', 'id', [randomUUID(), 111, randomUUID()])).toThrowError();
		});

		it('Does not throw an error when provided with a valid uuid key', () => {
			expect(() => validateKeys(schema, 'pk_uuid', 'id', randomUUID())).not.toThrowError();
		});

		it('Does not throw an error when provided with an array of valid uuid keys', () => {
			expect(() =>
				validateKeys(schema, 'pk_uuid', 'id', [randomUUID(), randomUUID(), randomUUID()]),
			).not.toThrowError();
		});
	});
});
