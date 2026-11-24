import type { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import display from './index';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

// Return the real translations display so fields() recursion through adjustFieldsForDisplays is exercised.
vi.mock('@/composables/use-extension', () => ({
	useExtension: (_type: string, id: string | { value: string | null }) => {
		const displayId = typeof id === 'string' ? id : id.value;
		return { value: displayId === 'translations' ? display : null };
	},
}));

function field(collection: string, name: string, type: string, meta: Partial<Field['meta']> = {}, primaryKey = false) {
	return {
		collection,
		field: name,
		type,
		name,
		schema: type === 'alias' ? null : { is_primary_key: primaryKey },
		meta: { collection, field: name, special: null, display: null, ...meta },
	} as Field;
}

function collection(name: string) {
	return {
		collection: name,
		name,
		meta: { collection: name, display_template: null, status: 'active' },
		schema: { name },
	};
}

// articles.title is a translations field whose translation collection articles_translations also has a `title` text field.
function seedTranslations() {
	useCollectionsStore().collections = [
		collection('languages'),
		collection('articles'),
		collection('articles_translations'),
	] as any;

	useFieldsStore().fields = [
		field('languages', 'code', 'string', {}, true),
		field('languages', 'name', 'string'),
		field('articles', 'id', 'integer', {}, true),
		field('articles', 'title', 'alias', {
			special: ['translations'],
			display: 'translations',
			display_options: { template: '{{title}}', languageField: 'name' },
		}),
		field('articles_translations', 'id', 'integer', {}, true),
		field('articles_translations', 'articles_id', 'integer'),
		field('articles_translations', 'languages_code', 'string'),
		field('articles_translations', 'title', 'string'),
	];

	useRelationsStore().relations = [
		// Junction -> parent (one side of the translations field).
		{
			collection: 'articles_translations',
			field: 'articles_id',
			related_collection: 'articles',
			schema: null,
			meta: {
				many_collection: 'articles_translations',
				many_field: 'articles_id',
				one_collection: 'articles',
				one_field: 'title',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'languages_code',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		// Junction -> languages (the language relation).
		{
			collection: 'articles_translations',
			field: 'languages_code',
			related_collection: 'languages',
			schema: null,
			meta: {
				many_collection: 'articles_translations',
				many_field: 'languages_code',
				one_collection: 'languages',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'articles_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	] as Relation[];
}

function getFields(template: string | null, languageField: string | null = 'name') {
	const fields = display.fields as unknown as (
		options: { template: string | null; languageField: string | null } | null,
		context: { collection: string; field: string; type: string },
	) => string[];

	return fields({ template, languageField }, { collection: 'articles', field: 'title', type: 'alias' }).sort();
}

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
	seedTranslations();
});

describe('fields for a translations field', () => {
	test('returns a finite list when the template key equals a translation collection field key', () => {
		expect(getFields('{{title}}')).toEqual(['*', 'languages_code.code', 'languages_code.name', 'title']);
	});

	test('returns the template field when its key differs from every translation collection field', () => {
		expect(getFields('{{headline}}')).toEqual(['*', 'headline', 'languages_code.code', 'languages_code.name']);
	});

	test('returns the wildcard and language fields when no template is set', () => {
		expect(getFields(null)).toEqual(['*', 'languages_code.code', 'languages_code.name']);
	});

	test('returns an empty list when the relations are missing', () => {
		useRelationsStore().relations = [];

		expect(getFields('{{title}}')).toEqual([]);
	});
});
