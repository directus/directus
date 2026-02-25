import type { Field, Relation } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { detectTranslationConfigs, isFieldEligibleForTranslations } from './utils';

function makeField(input: Partial<Field>): Field {
	return {
		collection: 'articles',
		field: 'title',
		type: 'string',
		name: 'title',
		schema: {
			has_auto_increment: false,
		},
		meta: {
			special: null,
			system: false,
		},
		...input,
	} as Field;
}

function makeRelation(input: Partial<Relation>): Relation {
	return {
		collection: 'articles_translations',
		field: 'articles_id',
		related_collection: 'articles',
		schema: null,
		meta: {
			id: 1,
			many_collection: 'articles_translations',
			many_field: 'articles_id',
			one_collection: 'articles',
			one_field: 'translations',
			one_collection_field: null,
			one_allowed_collections: null,
			one_deselect_action: 'nullify',
			junction_field: 'languages_code',
			sort_field: null,
		},
		...input,
	} as Relation;
}

describe('system-collections-translations utils', () => {
	test.each([
		{
			name: 'primary key',
			field: makeField({ field: 'id' }),
			primaryKeyField: 'id',
		},
		{
			name: 'system field',
			field: makeField({ meta: { special: null, system: true } as any }),
			primaryKeyField: 'id',
		},
		{
			name: 'alias field',
			field: makeField({ type: 'alias' }),
			primaryKeyField: 'id',
		},
		{
			name: 'auto-increment field',
			field: makeField({ schema: { has_auto_increment: true } as any }),
			primaryKeyField: 'id',
		},
		{
			name: 'dangerous special field',
			field: makeField({ meta: { special: ['uuid'], system: false } as any }),
			primaryKeyField: 'id',
		},
		{
			name: 'relational special field',
			field: makeField({ meta: { special: ['m2o'], system: false } as any }),
			primaryKeyField: 'id',
		},
	])('isFieldEligibleForTranslations rejects $name', ({ field, primaryKeyField }) => {
		expect(isFieldEligibleForTranslations(field, primaryKeyField)).toBe(false);
	});

	test('isFieldEligibleForTranslations accepts regular content fields', () => {
		expect(isFieldEligibleForTranslations(makeField({ field: 'title' }), 'id')).toBe(true);
	});

	test('detectTranslationConfigs returns valid config when relation pair is complete', () => {
		const configs = detectTranslationConfigs(
			'articles',
			[
				makeField({
					field: 'translations',
					type: 'alias',
					meta: { special: ['translations'], system: false } as any,
					schema: null,
				}),
			],
			[
				makeRelation({}),
				makeRelation({
					collection: 'articles_translations',
					field: 'languages_code',
					related_collection: 'languages',
					meta: {
						id: 2,
						many_collection: 'articles_translations',
						many_field: 'languages_code',
						one_collection: 'languages',
						one_field: null,
						one_collection_field: null,
						one_allowed_collections: null,
						one_deselect_action: 'nullify',
						junction_field: 'articles_id',
						sort_field: null,
					},
				}),
			],
		);

		expect(configs).toEqual([
			{
				translationField: 'translations',
				translationsCollection: 'articles_translations',
				parentForeignKeyField: 'articles_id',
				languageForeignKeyField: 'languages_code',
				languagesCollection: 'languages',
				valid: true,
			},
		]);
	});

	test('detectTranslationConfigs marks config invalid when parent relation is ambiguous', () => {
		const configs = detectTranslationConfigs(
			'articles',
			[
				makeField({
					field: 'translations',
					type: 'alias',
					meta: { special: ['translations'], system: false } as any,
					schema: null,
				}),
			],
			[makeRelation({ field: 'articles_id' }), makeRelation({ field: 'articles_slug' })],
		);

		expect(configs).toEqual([
			{
				translationField: 'translations',
				translationsCollection: '',
				parentForeignKeyField: '',
				languageForeignKeyField: '',
				languagesCollection: null,
				valid: false,
			},
		]);
	});

	test('detectTranslationConfigs marks config invalid when language relation is missing', () => {
		const configs = detectTranslationConfigs(
			'articles',
			[
				makeField({
					field: 'translations',
					type: 'alias',
					meta: { special: ['translations'], system: false } as any,
					schema: null,
				}),
			],
			[makeRelation({})],
		);

		expect(configs).toEqual([
			{
				translationField: 'translations',
				translationsCollection: 'articles_translations',
				parentForeignKeyField: 'articles_id',
				languageForeignKeyField: 'languages_code',
				languagesCollection: null,
				valid: false,
			},
		]);
	});

	test('detectTranslationConfigs marks config invalid when language relation has no related collection', () => {
		const configs = detectTranslationConfigs(
			'articles',
			[
				makeField({
					field: 'translations',
					type: 'alias',
					meta: { special: ['translations'], system: false } as any,
					schema: null,
				}),
			],
			[
				makeRelation({}),
				makeRelation({
					collection: 'articles_translations',
					field: 'languages_code',
					related_collection: null,
					meta: {
						id: 2,
						many_collection: 'articles_translations',
						many_field: 'languages_code',
						one_collection: null,
						one_field: null,
						one_collection_field: null,
						one_allowed_collections: null,
						one_deselect_action: 'nullify',
						junction_field: 'articles_id',
						sort_field: null,
					},
				}),
			],
		);

		expect(configs).toEqual([
			{
				translationField: 'translations',
				translationsCollection: 'articles_translations',
				parentForeignKeyField: 'articles_id',
				languageForeignKeyField: 'languages_code',
				languagesCollection: null,
				valid: false,
			},
		]);
	});

	test('detectTranslationConfigs ignores same-collection relations to avoid false matches', () => {
		const configs = detectTranslationConfigs(
			'articles',
			[
				makeField({
					field: 'translations',
					type: 'alias',
					meta: { special: ['translations'], system: false } as any,
					schema: null,
				}),
			],
			[
				makeRelation({
					collection: 'articles',
					field: 'translations_fk',
					related_collection: 'articles',
					meta: {
						id: 3,
						many_collection: 'articles',
						many_field: 'translations_fk',
						one_collection: 'articles',
						one_field: 'translations',
						one_collection_field: null,
						one_allowed_collections: null,
						one_deselect_action: 'nullify',
						junction_field: 'languages_code',
						sort_field: null,
					},
				}),
			],
		);

		expect(configs).toEqual([
			{
				translationField: 'translations',
				translationsCollection: '',
				parentForeignKeyField: '',
				languageForeignKeyField: '',
				languagesCollection: null,
				valid: false,
			},
		]);
	});
});
