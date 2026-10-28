import { Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { merge } from 'lodash-es';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computed } from 'vue';
import { useFieldsStore } from './fields';
import { useRelationsStore } from './relations';
import { i18n } from '@/lang';
import { translate as translateLiteral } from '@/utils/translate-literal';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

const mockField = {
	collection: 'a',
	field: 'name',
	type: 'string',
	schema: {},
	meta: {
		collection: 'a',
		field: 'name',
		options: null,
		display_options: null,
		note: 'note',
		validation_message: null,
	},
} as Field;

vi.mock('@/api', () => {
	return {
		default: {
			get: (path: string) => {
				if (path === '/fields') {
					return Promise.resolve({
						data: {
							data: [mockField],
						},
					});
				}

				if (path === '/collections') return Promise.resolve({ data: { data: [] } });

				return Promise.reject(new Error(`Path "${path}" is not mocked in this test`));
			},
			post: (_path: string, body: Field) => Promise.resolve({ data: { data: body } }),
			patch: (path: string, body: Partial<Field>) => {
				const [collection, field] = path.split('/').slice(-2) as [string, string];
				return Promise.resolve({ data: { data: merge({ collection, field }, body) } });
			},
			delete: () => Promise.resolve(),
		},
	};
});

vi.mock('@/utils/translate-literal', () => {
	return {
		translate: vi.fn(),
	};
});

describe('hydrate action', () => {
	test('should not skip translations by default', async () => {
		const fieldsStore = useFieldsStore();
		await fieldsStore.hydrate();

		expect(translateLiteral).toHaveBeenCalledWith('note');
	});

	test('should skip translations when skipTranslation is true', async () => {
		const fieldsStore = useFieldsStore();
		await fieldsStore.hydrate({ skipTranslation: true });

		expect(translateLiteral).not.toHaveBeenCalledWith('note');
	});
});

describe('parseField action', () => {
	test('should translate field name when translations are added then removed', async () => {
		const fieldsStore = useFieldsStore();

		const mockFieldWithTranslations = merge({}, mockField, {
			meta: {
				translations: [
					{
						language: 'en-US',
						translation: 'Name en-US',
					},
				],
			},
		});

		fieldsStore.fields = [mockFieldWithTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('Name en-US');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(true);

		const mockFieldWithoutTranslations = merge({}, mockField, {
			meta: {
				translations: [
					{
						language: 'zh-CN',
						translation: 'Name zh-CN',
					},
				],
			},
		});

		fieldsStore.fields = [mockFieldWithoutTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('Name');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(false);
	});

	test('should translate field name when translations are added and reset when removed', async () => {
		const fieldsStore = useFieldsStore();

		const mockFieldWithTranslations = merge({}, mockField, {
			meta: {
				translations: [
					{
						language: 'en-US',
						translation: 'name en-US',
					},
				],
			},
		});

		fieldsStore.fields = [mockFieldWithTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('name en-US');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(true);

		const mockFieldWithoutTranslations = merge({}, mockField, {
			meta: {
				translations: null,
			},
		});

		fieldsStore.fields = [mockFieldWithoutTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('Name');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(false);
	});
});

function makeField(collection: string, field: string, meta: Partial<Field['meta']> = {}, schema = {}): Field {
	return {
		collection,
		field,
		name: field,
		type: 'string',
		schema: schema as Field['schema'],
		meta: { collection, field, sort: null, system: false, group: null, ...meta } as Field['meta'],
	};
}

describe('lookups', () => {
	test('getField finds fields by collection and key', () => {
		const fieldsStore = useFieldsStore();
		const title = makeField('a', 'title');
		fieldsStore.fields = [makeField('b', 'title'), title, makeField('a', 'body')];

		expect(fieldsStore.getField('a', 'title')).toBe(title);
		expect(fieldsStore.getField('a', 'missing')).toBeNull();
		expect(fieldsStore.getField('missing', 'title')).toBeNull();
	});

	test('getField resolves dotted keys through relations', () => {
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const authorName = makeField('authors', 'name');

		fieldsStore.fields = [makeField('articles', 'author'), makeField('authors', 'id'), authorName];

		relationsStore.relations = [
			{ collection: 'articles', field: 'author', related_collection: 'authors', meta: null, schema: null },
		] as any;

		expect(fieldsStore.getField('articles', 'author.name')).toBe(authorName);
		expect(fieldsStore.getField('articles', 'author.missing')).toBeNull();
		expect(fieldsStore.getField('articles', 'other.name')).toBeNull();
	});

	test('getPrimaryKeyFieldForCollection returns the primary key field', () => {
		const fieldsStore = useFieldsStore();
		const id = makeField('a', 'id', {}, { is_primary_key: true });
		fieldsStore.fields = [makeField('b', 'id', {}, { is_primary_key: true }), makeField('a', 'title'), id];

		expect(fieldsStore.getPrimaryKeyFieldForCollection('a')).toBe(id);
		expect(fieldsStore.getPrimaryKeyFieldForCollection('missing')).toBeNull();
	});

	test('getFieldsForCollection puts system fields first, then orders by sort', () => {
		const fieldsStore = useFieldsStore();

		fieldsStore.fields = [
			makeField('a', 'unsorted'),
			makeField('a', 'third', { sort: 3 }),
			makeField('b', 'other', { sort: 1 }),
			makeField('a', 'first', { sort: 1 }),
			makeField('a', 'system', { system: true, sort: 5 }),
			makeField('a', 'second', { sort: 2 }),
		];

		expect(fieldsStore.getFieldsForCollection('a').map(({ field }) => field)).toEqual([
			'system',
			'first',
			'second',
			'third',
			'unsorted',
		]);

		expect(fieldsStore.getFieldsForCollection('missing')).toEqual([]);
	});

	test('mutating a returned field list does not affect later lookups', () => {
		const fieldsStore = useFieldsStore();
		fieldsStore.fields = [makeField('a', 'b', { sort: 1 }), makeField('a', 'a', { sort: 2 })];

		expect(fieldsStore.getFieldsForCollectionAlphabetical('a').map(({ field }) => field)).toEqual(['a', 'b']);

		fieldsStore.getFieldsForCollection('a').pop();

		expect(fieldsStore.getFieldsForCollection('a').map(({ field }) => field)).toEqual(['b', 'a']);
	});

	test('getFieldsForCollectionSorted nests group children after their group', () => {
		const fieldsStore = useFieldsStore();

		fieldsStore.fields = [
			makeField('a', 'child_2', { sort: 2, group: 'group' }),
			makeField('a', 'after', { sort: 3 }),
			makeField('a', 'group', { sort: 2 }),
			makeField('a', 'child_1', { sort: 1, group: 'group' }),
			makeField('a', 'before', { sort: 1 }),
		];

		expect(fieldsStore.getFieldsForCollectionSorted('a').map(({ field }) => field)).toEqual([
			'before',
			'group',
			'child_1',
			'child_2',
			'after',
		]);

		expect(fieldsStore.getFieldGroupChildren('a', 'group')?.map(({ field }) => field)).toEqual(['child_2', 'child_1']);
	});
});

describe('reactivity', () => {
	test('lookups update after hydrate, create, update and delete', async () => {
		const fieldsStore = useFieldsStore();

		const title = computed(() => fieldsStore.getField('a', 'title'));
		const name = computed(() => fieldsStore.getField('a', 'name'));
		const collectionFields = computed(() => fieldsStore.getFieldsForCollection('a').map(({ field }) => field));

		expect(name.value).toBeNull();

		await fieldsStore.hydrate({ skipTranslation: true });
		expect(name.value?.field).toBe('name');
		expect(collectionFields.value).toEqual(['name']);

		await fieldsStore.upsertField('a', 'title', { collection: 'a', field: 'title', type: 'string', meta: { sort: 1 } });
		expect(title.value?.field).toBe('title');
		expect(collectionFields.value).toEqual(['title', 'name']);

		await fieldsStore.upsertField('a', 'title', { meta: { note: 'updated' } });
		expect(title.value?.meta?.note).toBe('updated');

		await fieldsStore.deleteField('a', 'title');
		expect(title.value).toBeNull();
		expect(collectionFields.value).toEqual(['name']);

		await fieldsStore.dehydrate();
		expect(name.value).toBeNull();
	});
});
