import { InvalidPayloadError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import { cloneFields, validateFieldsEligibility } from './translations-shared.js';

describe('translations-shared', () => {
	test('validateFieldsEligibility rejects non-eligible fields', () => {
		expect(() =>
			validateFieldsEligibility([
				{
					collection: 'articles',
					field: 'title',
					type: 'alias',
					schema: {},
					meta: null,
					name: 'title',
				} as any,
			]),
		).toThrow(InvalidPayloadError);

		expect(() =>
			validateFieldsEligibility([
				{
					collection: 'articles',
					field: 'title',
					type: 'string',
					schema: {},
					meta: { special: ['uuid'] },
					name: 'title',
				} as any,
			]),
		).toThrow(InvalidPayloadError);
	});

	test('cloneFields clones source fields and strips unsupported metadata/specials', () => {
		const cloned = cloneFields({
			fields: ['title'],
			sourceFields: [
				{
					collection: 'articles',
					field: 'title',
					type: 'string',
					schema: {
						default_value: 'draft',
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
					},
					meta: {
						id: 1,
						collection: 'articles',
						sort: 1,
						group: 'content',
						required: true,
						hidden: true,
						readonly: true,
						special: ['no-data', 'custom'],
						note: 'note',
					},
					name: 'title',
				} as any,
			],
		});

		expect(cloned).toEqual([
			{
				field: 'title',
				type: 'string',
				schema: {
					default_value: 'draft',
					max_length: 255,
					numeric_precision: null,
					numeric_scale: null,
					is_nullable: true,
				},
				meta: {
					required: false,
					hidden: false,
					readonly: false,
					special: ['custom'],
					note: 'note',
				},
			},
		]);
	});

	test('cloneFields rejects unknown source fields', () => {
		expect(() =>
			cloneFields({
				fields: ['missing'],
				sourceFields: [],
			}),
		).toThrow(InvalidPayloadError);
	});
});
