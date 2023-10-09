import type { SchemaOverview } from '@directus/types';
import { v4 as uuid } from 'uuid';
import { describe, expect, it } from 'vitest';
import { validateKeys } from './validate-keys.js';

const schema: SchemaOverview = {
	collections: {
		pk_integer: {
			collection: 'pk_integer',
			primary: 'id',
			singleton: false,
			note: 'Sample schema with integer primary key',
			sortField: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'integer',
					dbType: 'integer',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
					validation: null,
				},
			},
		},
		pk_uuid: {
			collection: 'pk_uuid',
			primary: 'id',
			singleton: false,
			note: 'Sample schema with uuid primary key',
			sortField: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
					validation: null,
				},
			},
		},
	},
	relations: [],
};

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
				validateKeys(schema, 'pk_uuid', 'id', [uuid(), 'fakeuuid-62d9-434d-a7c7-878c8376782e', uuid()])
			).toThrowError();

			expect(() => validateKeys(schema, 'pk_uuid', 'id', [uuid(), 'invalid', uuid()])).toThrowError();
			expect(() => validateKeys(schema, 'pk_uuid', 'id', [uuid(), NaN, uuid()])).toThrowError();
			expect(() => validateKeys(schema, 'pk_uuid', 'id', [uuid(), 111, uuid()])).toThrowError();
		});

		it('Does not throw an error when provided with a valid uuid key', () => {
			expect(() => validateKeys(schema, 'pk_uuid', 'id', uuid())).not.toThrowError();
		});

		it('Does not throw an error when provided with an array of valid uuid keys', () => {
			expect(() => validateKeys(schema, 'pk_uuid', 'id', [uuid(), uuid(), uuid()])).not.toThrowError();
		});
	});
});
