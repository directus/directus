import type { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import SystemCollectionsTranslationsDialog from './system-collections-translations-dialog.vue';
import SystemCollectionsTranslations from './system-collections-translations.vue';
import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('@/api', () => ({
	default: {
		post: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

function makeField(
	collection: string,
	field: string,
	type: Field['type'],
	options?: {
		isPrimaryKey?: boolean;
		special?: string[] | null;
		system?: boolean;
		hasAutoIncrement?: boolean;
		group?: string | null;
	},
): Field {
	return {
		collection,
		field,
		type,
		name: field,
		schema: {
			is_primary_key: options?.isPrimaryKey ?? false,
			has_auto_increment: options?.hasAutoIncrement ?? false,
			default_value: null,
			max_length: null,
			numeric_precision: null,
			numeric_scale: null,
		},
		meta: {
			special: options?.special ?? null,
			system: options?.system ?? false,
			sort: 1,
			group: options?.group ?? null,
		},
	} as unknown as Field;
}

function makeCollection(collection: string) {
	return {
		collection,
		name: collection,
		meta: {},
		schema: {},
	} as any;
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

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: {
		'en-US': {
			enable_translations: 'Enable Translations',
			manage_translation_fields: 'Add Translation Fields',
			translations_already_enabled: 'Translations enabled',
			translations_enable_helper_description: 'Translate content into multiple languages.',
			translations_manage_helper_description: 'You can add more fields to translate from this collection.',
			translations_copy_data_note: 'Fields are copied to the translations collection. Existing data is not migrated.',
			translations_source_fields_hidden_note: 'Selected source fields will be set to hidden and readonly.',
			translation_configuration: 'Translation Configuration',
			translations_invalid_config_warning:
				'{count} translation config could not be resolved and will remain read-only | {count} translation configs could not be resolved and will remain read-only',
			fields_to_translate: 'Fields to Translate',
			fields_to_add_to_translations: 'Fields to Add to Translations',
			translations_collection_name: 'Translations collection name',
			languages_collection: 'Languages Collection',
			translations_collection_already_exists: 'Translations collection already exists',
			translations_fields_up_to_date: 'All eligible fields are already present in the translations collection.',
			translations_preview_collections: 'Collections',
			translations_preview_fields: 'Fields',
			translations_preview_relations: 'Relations',
			show_advanced_options: 'Show Relationship Details',
			hide_advanced_options: 'Hide Relationship Details',
			new_data_alert: 'The following will be created within your Data Model:',
			add_fields: 'Add Fields',
			cancel: 'Cancel',
			enable: 'Enable',
			search_collection: 'Search Collection...',
			no_fields_in_collection: 'There are no fields in "{collection}" yet',
			a_unique_table_name: 'A unique table name...',
			select: 'Select...',
			ungrouped: 'Ungrouped',
			add_field: 'Add Field',
			select_all: 'Select All',
			deselect_all: 'Deselect All',
			save: 'Save',
		},
	},
});

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

describe('system-collections-translations helper', () => {
	test('shows manage state when collection has a valid translations config', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		collectionsStore.collections = [makeCollection('articles'), makeCollection('languages')];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'translations', 'alias', { special: ['translations'] }),
		];

		relationsStore.relations = [
			makeRelation({
				collection: 'articles_translations',
				field: 'articles_id',
				related_collection: 'articles',
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
			}),
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
		];

		const wrapper = mount(SystemCollectionsTranslations, {
			global: {
				plugins: [i18n],
				provide: {
					values: ref({ collection: 'articles' }),
				},
				stubs: {
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VButton: { template: '<button><slot /></button>' },
					VSelect: { template: '<select />' },
					SystemCollectionsTranslationsDialog: true,
				},
			},
		});

		expect(wrapper.text()).toContain('Translations enabled');
		expect(wrapper.text()).toContain('Add Fields');
	});

	test('shows enable state when translations are not enabled', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [makeCollection('articles')];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'title', 'string'),
		];

		const wrapper = mount(SystemCollectionsTranslations, {
			global: {
				plugins: [i18n],
				provide: {
					values: ref({ collection: 'articles' }),
				},
				stubs: {
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VButton: { template: '<button><slot /></button>' },
					VSelect: { template: '<select />' },
					SystemCollectionsTranslationsDialog: true,
				},
			},
		});

		expect(wrapper.text()).toContain('Enable Translations');
		expect(wrapper.text()).not.toContain('Manage');
	});

	test('shows translation configuration selector when multiple configs exist', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		collectionsStore.collections = [
			makeCollection('articles'),
			makeCollection('languages'),
			makeCollection('regional_languages'),
		];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'translations', 'alias', { special: ['translations'] }),
			makeField('articles', 'regional_translations', 'alias', { special: ['translations'] }),
		];

		relationsStore.relations = [
			makeRelation({
				collection: 'articles_translations',
				field: 'articles_id',
				related_collection: 'articles',
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
			}),
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
			makeRelation({
				collection: 'articles_regional_translations',
				field: 'articles_id',
				related_collection: 'articles',
				meta: {
					id: 3,
					many_collection: 'articles_regional_translations',
					many_field: 'articles_id',
					one_collection: 'articles',
					one_field: 'regional_translations',
					one_collection_field: null,
					one_allowed_collections: null,
					one_deselect_action: 'nullify',
					junction_field: 'regional_languages_code',
					sort_field: null,
				},
			}),
			makeRelation({
				collection: 'articles_regional_translations',
				field: 'regional_languages_code',
				related_collection: 'regional_languages',
				meta: {
					id: 4,
					many_collection: 'articles_regional_translations',
					many_field: 'regional_languages_code',
					one_collection: 'regional_languages',
					one_field: null,
					one_collection_field: null,
					one_allowed_collections: null,
					one_deselect_action: 'nullify',
					junction_field: 'articles_id',
					sort_field: null,
				},
			}),
		];

		const wrapper = mount(SystemCollectionsTranslations, {
			global: {
				plugins: [i18n],
				provide: {
					values: ref({ collection: 'articles' }),
				},
				stubs: {
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VButton: { template: '<button><slot /></button>' },
					VSelect: { template: '<select />' },
					SystemCollectionsTranslationsDialog: true,
				},
			},
		});

		expect(wrapper.text()).toContain('Translation Configuration');
	});
});

describe('system-collections-translations dialog', () => {
	test('pre-selects all eligible fields by default', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [makeCollection('articles'), makeCollection('languages')];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'title', 'string'),
			makeField('articles', 'sort', 'integer'),
			makeField('articles', 'date_created', 'timestamp'),
			makeField('articles', 'date_updated', 'timestamp'),
			makeField('articles', 'user_created', 'uuid'),
			makeField('articles', 'user_updated', 'uuid'),
			makeField('languages', 'code', 'string', { isPrimaryKey: true }),
		];

		const wrapper = mount(SystemCollectionsTranslationsDialog, {
			props: {
				collection: 'articles',
				active: true,
				mode: 'enable',
			},
			global: {
				plugins: [i18n],
				stubs: {
					VDrawer: { template: '<div><slot name="actions" /><slot /></div>' },
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VInput: { template: '<input />' },
					VSelect: { template: '<select />' },
					VCheckbox: { template: '<input type="checkbox" />' },
					VIcon: { template: '<i />' },
					VButton: { template: '<button><slot /></button>' },
				},
			},
		});

		const allEligible = (wrapper.vm as any).targetFieldOptions.map((field: { field: string }) => field.field);

		expect((wrapper.vm as any).selectedFields).toEqual(allEligible);
		expect(wrapper.text()).toContain('Selected source fields will be set to hidden and readonly.');
	});

	test('submits enable payload and closes on success', async () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		collectionsStore.collections = [makeCollection('articles'), makeCollection('languages')];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'title', 'string'),
			makeField('articles', 'slug', 'string'),
			makeField('languages', 'code', 'string', { isPrimaryKey: true }),
		];

		const hydrateCollectionsSpy = vi.spyOn(collectionsStore, 'hydrate').mockResolvedValue();
		const hydrateFieldsSpy = vi.spyOn(fieldsStore, 'hydrate').mockResolvedValue();
		const hydrateRelationsSpy = vi.spyOn(relationsStore, 'hydrate').mockResolvedValue();

		vi.mocked(api.post).mockResolvedValue({ data: { data: {} } } as any);

		const wrapper = mount(SystemCollectionsTranslationsDialog, {
			props: {
				collection: 'articles',
				active: true,
				mode: 'enable',
			},
			global: {
				plugins: [i18n],
				stubs: {
					VDrawer: { template: '<div><slot name="actions" /><slot /></div>' },
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VInput: { template: '<input />' },
					VSelect: { template: '<select />' },
					VCheckbox: { template: '<input type="checkbox" />' },
					VIcon: { template: '<i />' },
					VButton: { template: '<button><slot /></button>' },
				},
			},
		});

		(wrapper.vm as any).selectedFields = ['title', 'slug'];
		(wrapper.vm as any).translationsCollectionName = 'articles_i18n';
		(wrapper.vm as any).languagesCollection = 'languages';
		(wrapper.vm as any).parentForeignKeyField = 'articles_id';
		(wrapper.vm as any).languageForeignKeyField = 'languages_code';

		await (wrapper.vm as any).submit();

		expect(api.post).toHaveBeenCalledWith('/utils/translations/generate', {
			collection: 'articles',
			fields: ['title', 'slug'],
			translationsCollection: 'articles_i18n',
			languagesCollection: 'languages',
			parentFkField: 'articles_id',
			languageFkField: 'languages_code',
			createLanguagesCollection: false,
			seedLanguages: false,
		});

		expect(hydrateCollectionsSpy).toHaveBeenCalledTimes(1);
		expect(hydrateFieldsSpy).toHaveBeenCalledTimes(1);
		expect(hydrateRelationsSpy).toHaveBeenCalledTimes(1);
		expect(wrapper.emitted('update:active')).toEqual([[false]]);
	});

	test('submits additive manage-fields payload and closes on success', async () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		collectionsStore.collections = [
			makeCollection('articles'),
			makeCollection('languages'),
			makeCollection('articles_translations'),
		];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'title', 'string'),
			makeField('articles', 'slug', 'string'),
			makeField('articles_translations', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles_translations', 'articles_id', 'integer'),
			makeField('articles_translations', 'languages_code', 'string'),
			makeField('articles_translations', 'title', 'string'),
		];

		const hydrateCollectionsSpy = vi.spyOn(collectionsStore, 'hydrate').mockResolvedValue();
		const hydrateFieldsSpy = vi.spyOn(fieldsStore, 'hydrate').mockResolvedValue();
		const hydrateRelationsSpy = vi.spyOn(relationsStore, 'hydrate').mockResolvedValue();

		vi.mocked(api.post).mockResolvedValue({ data: { data: {} } } as any);

		const wrapper = mount(SystemCollectionsTranslationsDialog, {
			props: {
				collection: 'articles',
				active: true,
				mode: 'manage',
				config: {
					translationField: 'translations',
					translationsCollection: 'articles_translations',
					parentForeignKeyField: 'articles_id',
					languageForeignKeyField: 'languages_code',
					languagesCollection: 'languages',
					valid: true,
				},
			},
			global: {
				plugins: [i18n],
				stubs: {
					VDrawer: { template: '<div><slot name="actions" /><slot /></div>' },
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VInput: { template: '<input />' },
					VSelect: { template: '<select />' },
					VCheckbox: { template: '<input type="checkbox" />' },
					VIcon: { template: '<i />' },
					VButton: { template: '<button><slot /></button>' },
				},
			},
		});

		(wrapper.vm as any).selectedFields = ['slug'];

		await (wrapper.vm as any).submit();

		expect(api.post).toHaveBeenCalledWith('/utils/translations/generate', {
			collection: 'articles',
			translationsCollection: 'articles_translations',
			fields: ['slug'],
		});

		expect(hydrateCollectionsSpy).toHaveBeenCalledTimes(1);
		expect(hydrateFieldsSpy).toHaveBeenCalledTimes(1);
		expect(hydrateRelationsSpy).toHaveBeenCalledTimes(1);
		expect(wrapper.emitted('update:active')).toEqual([[false]]);
	});

	test('keeps dialog open and calls unexpectedError on failure', async () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		collectionsStore.collections = [makeCollection('articles'), makeCollection('languages')];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'title', 'string'),
		];

		const hydrateCollectionsSpy = vi.spyOn(collectionsStore, 'hydrate').mockResolvedValue();
		const hydrateFieldsSpy = vi.spyOn(fieldsStore, 'hydrate').mockResolvedValue();
		const hydrateRelationsSpy = vi.spyOn(relationsStore, 'hydrate').mockResolvedValue();

		vi.mocked(api.post).mockRejectedValue(new Error('Request failed'));

		const wrapper = mount(SystemCollectionsTranslationsDialog, {
			props: {
				collection: 'articles',
				active: true,
				mode: 'enable',
			},
			global: {
				plugins: [i18n],
				stubs: {
					VDrawer: { template: '<div><slot name="actions" /><slot /></div>' },
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VInput: { template: '<input />' },
					VSelect: { template: '<select />' },
					VCheckbox: { template: '<input type="checkbox" />' },
					VIcon: { template: '<i />' },
					VButton: { template: '<button><slot /></button>' },
				},
			},
		});

		(wrapper.vm as any).selectedFields = ['title'];
		(wrapper.vm as any).translationsCollectionName = 'articles_i18n';
		(wrapper.vm as any).languagesCollection = 'languages';

		await (wrapper.vm as any).submit();

		expect(unexpectedError).toHaveBeenCalledTimes(1);
		expect(hydrateCollectionsSpy).not.toHaveBeenCalled();
		expect(hydrateFieldsSpy).not.toHaveBeenCalled();
		expect(hydrateRelationsSpy).not.toHaveBeenCalled();
		expect(wrapper.emitted('update:active')).toBeUndefined();
	});

	test('calls unexpectedError when post-processing fails after successful submit', async () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		collectionsStore.collections = [makeCollection('articles'), makeCollection('languages')];

		fieldsStore.fields = [
			makeField('articles', 'id', 'integer', { isPrimaryKey: true }),
			makeField('articles', 'title', 'string'),
			makeField('languages', 'code', 'string', { isPrimaryKey: true }),
		];

		const updateFieldsSpy = vi.spyOn(fieldsStore, 'updateFields').mockRejectedValue(new Error('Update failed'));
		const hydrateCollectionsSpy = vi.spyOn(collectionsStore, 'hydrate').mockResolvedValue();
		const hydrateFieldsSpy = vi.spyOn(fieldsStore, 'hydrate').mockResolvedValue();
		const hydrateRelationsSpy = vi.spyOn(relationsStore, 'hydrate').mockResolvedValue();

		vi.mocked(api.post).mockResolvedValue({ data: { data: {} } } as any);

		const wrapper = mount(SystemCollectionsTranslationsDialog, {
			props: {
				collection: 'articles',
				active: true,
				mode: 'enable',
			},
			global: {
				plugins: [i18n],
				stubs: {
					VDrawer: { template: '<div><slot name="actions" /><slot /></div>' },
					VNotice: { template: '<div><slot name="title" /><slot /></div>' },
					VInput: { template: '<input />' },
					VSelect: { template: '<select />' },
					VCheckbox: { template: '<input type="checkbox" />' },
					VIcon: { template: '<i />' },
					VButton: { template: '<button><slot /></button>' },
				},
			},
		});

		(wrapper.vm as any).selectedFields = ['title'];
		(wrapper.vm as any).translationsCollectionName = 'articles_i18n';
		(wrapper.vm as any).languagesCollection = 'languages';
		(wrapper.vm as any).parentForeignKeyField = 'articles_id';
		(wrapper.vm as any).languageForeignKeyField = 'languages_code';

		await (wrapper.vm as any).submit();

		expect(updateFieldsSpy).toHaveBeenCalledTimes(1);
		expect(hydrateCollectionsSpy).toHaveBeenCalledTimes(1);
		expect(hydrateFieldsSpy).toHaveBeenCalledTimes(1);
		expect(hydrateRelationsSpy).toHaveBeenCalledTimes(1);
		expect(unexpectedError).toHaveBeenCalledTimes(1);
		expect(wrapper.emitted('update:active')).toEqual([[false]]);
	});
});
