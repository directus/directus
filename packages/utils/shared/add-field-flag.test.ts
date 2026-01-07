import type { RawField } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { addFieldFlag } from './add-field-flag.js';

describe('addFieldFlag', () => {
	it('Adds a flag to a field without meta', () => {
		const field: RawField = {
			field: 'some_field',
			type: 'string',
		};

		addFieldFlag(field, 'cast-timestamp');

		expect(field.meta).toEqual({
			special: ['cast-timestamp'],
		});
	});

	it('Adds a flag to a field without existing flags', () => {
		const field: RawField = {
			field: 'some_field',
			type: 'string',
			meta: { special: null },
		};

		addFieldFlag(field, 'cast-timestamp');

		expect(field.meta).toEqual({
			special: ['cast-timestamp'],
		});
	});

	it('Adds a flag to a field with existing flags', () => {
		const field: RawField = {
			field: 'some_field',
			type: 'string',
			meta: { special: ['cast-datetime'] },
		};

		addFieldFlag(field, 'cast-timestamp');

		expect(field.meta).toEqual({
			special: ['cast-datetime', 'cast-timestamp'],
		});
	});

	it('Does not add a duplicate flag to a field with existing flags', () => {
		const field: RawField = {
			field: 'some_field',
			type: 'string',
			meta: { special: ['cast-datetime', 'cast-timestamp'] },
		};

		addFieldFlag(field, 'cast-datetime');

		expect(field.meta).toEqual({
			special: ['cast-datetime', 'cast-timestamp'],
		});
	});
});
