import { InvalidPayloadError } from '@directus/errors';
import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../emitter.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { ItemsService } from '../services/items.js';
import { RelationsService } from '../services/relations.js';
import { generateTranslations } from './generate-translations.js';
import { getSchema } from './get-schema.js';
import { transaction } from './transaction.js';

vi.mock('./get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('./transaction.js', () => ({
	transaction: vi.fn(),
}));

vi.mock('../emitter.js', () => ({
	default: {
		emitAction: vi.fn(),
	},
}));

class Client_PG extends MockClient {}

function createBaseSchema() {
	return {
		collections: {
			articles: {
				primary: 'id',
				fields: {
					id: { type: 'integer' },
					title: { type: 'string' },
					body: { type: 'text' },
				},
			},
			languages: createLanguagesSchema({
				name: { type: 'string' },
				direction: { type: 'string' },
			}),
		},
		relations: [],
	} as any;
}

function createLanguagesSchema(fields: Record<string, { type: string }>) {
	return {
		primary: 'code',
		fields: {
			code: { type: 'string' },
			...fields,
		},
	};
}

function createSchemaWithoutLanguages() {
	const schema = createBaseSchema();
	delete schema.collections['languages'];
	return schema;
}

function createSchemaWithTranslations() {
	const schema = createBaseSchema();

	schema.collections.articles.fields['translations'] = { type: 'alias', special: ['translations'] };

	schema.collections['articles_translations'] = {
		primary: 'id',
		fields: {
			id: { type: 'integer' },
			articles_id: { type: 'integer' },
			languages_code: { type: 'string' },
		},
	};

	schema.relations = [
		{
			collection: 'articles_translations',
			field: 'articles_id',
			related_collection: 'articles',
			meta: {
				one_collection: null,
				many_collection: null,
				one_field: 'translations',
				junction_field: 'languages_code',
			},
		},
		{
			collection: 'articles_translations',
			field: 'languages_code',
			related_collection: 'languages',
			meta: {
				one_collection: null,
				many_collection: null,
				one_field: null,
				junction_field: 'articles_id',
			},
		},
	];

	return schema;
}

describe('generateTranslations', () => {
	let database: Knex;

	let sourceFieldsMap: Record<string, Record<string, any>>;

	beforeEach(() => {
		database = knex.default({ client: Client_PG });

		sourceFieldsMap = {
			title: {
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
					sort: 5,
					group: 'content',
					special: null,
					required: true,
					hidden: true,
					readonly: true,
					note: 'Original note',
				},
			},
			body: {
				field: 'body',
				type: 'text',
				schema: {
					default_value: null,
					max_length: null,
					numeric_precision: null,
					numeric_scale: null,
				},
				meta: {
					special: null,
				},
			},
		};

		vi.mocked(transaction).mockImplementation(async (_knex, callback) => callback(database as any));
		vi.mocked(getSchema).mockResolvedValue(createBaseSchema());

		vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('ok');

		vi.spyOn(FieldsService.prototype, 'readOne').mockImplementation(
			async (_collection, field) => sourceFieldsMap[field]!,
		);

		vi.spyOn(FieldsService.prototype, 'createField').mockResolvedValue(undefined as any);
		vi.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([]);
		vi.spyOn(RelationsService.prototype, 'createOne').mockResolvedValue();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('rejects invalid payloads from zod validation', async () => {
		await expect(
			generateTranslations(
				{ collection: '', fields: [] },
				{
					knex: database as any,
					schema: createBaseSchema(),
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects non-db-safe identifier payload values', async () => {
		await expect(
			generateTranslations(
				{
					collection: 'articles;',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema: createBaseSchema(),
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects unknown fields', async () => {
		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['missing_field'],
				},
				{
					knex: database as any,
					schema: createBaseSchema(),
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects duplicate target field names from overrides', async () => {
		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
					parentFkField: 'title',
				},
				{
					knex: database as any,
					schema: createBaseSchema(),
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects when translation collection is not related to source collection', async () => {
		const schema = createSchemaWithTranslations();
		schema.relations = [];

		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema,
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects when existing translation relation does not point to a translations field', async () => {
		const schema = createSchemaWithTranslations();
		schema.relations[0]!.meta!.one_field = 'title';

		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema,
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects when existing translation relation is missing reciprocal language relation', async () => {
		const schema = createSchemaWithTranslations();
		schema.relations = [schema.relations[0]!];

		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema,
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects when field already exists in translation collection', async () => {
		const schema = createSchemaWithTranslations();
		schema.collections.articles_translations.fields['title'] = { type: 'string' };

		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema,
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects duplicate field names in request payload', async () => {
		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title', 'title'],
				},
				{
					knex: database as any,
					schema: createSchemaWithTranslations(),
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects when parent collection already has translations field', async () => {
		const schema = createBaseSchema();
		schema.collections.articles.fields['translations'] = { type: 'alias' };

		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema,
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('rejects when parent collection has a renamed translations special field', async () => {
		const schema = createBaseSchema();
		schema.collections.articles.fields['localized_content'] = { type: 'alias', special: ['translations'] };

		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema,
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test.each([
		{
			name: 'alias fields',
			field: {
				field: 'title',
				type: 'alias',
				schema: {},
				meta: { special: null },
			},
		},
		{
			name: 'auto-increment fields',
			field: {
				field: 'title',
				type: 'integer',
				schema: { has_auto_increment: true },
				meta: { special: null },
			},
		},
		{
			name: 'dangerous special fields',
			field: {
				field: 'title',
				type: 'string',
				schema: {},
				meta: { special: ['uuid'] },
			},
		},
		{
			name: 'file relational fields',
			field: {
				field: 'title',
				type: 'string',
				schema: {},
				meta: { special: ['file'] },
			},
		},
	])('rejects non-eligible fields: $name', async ({ field }) => {
		sourceFieldsMap['title'] = field;

		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
				},
				{
					knex: database as any,
					schema: createBaseSchema(),
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('creates and seeds languages collection when missing', async () => {
		const createCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne');
		const createItemsSpy = vi.spyOn(ItemsService.prototype, 'createMany');

		const schemaAfterLanguages = createSchemaWithoutLanguages();

		schemaAfterLanguages.collections['languages'] = createLanguagesSchema({
			name: { type: 'string' },
			direction: { type: 'string' },
		});

		const schemaAfterJunction = structuredClone(schemaAfterLanguages);

		schemaAfterJunction.collections['articles_translations'] = {
			primary: 'id',
			fields: {
				id: { type: 'integer' },
				articles_id: { type: 'integer' },
				languages_code: { type: 'string' },
			},
		};

		const schemaAfterRelations = structuredClone(schemaAfterJunction);

		vi.mocked(getSchema)
			// 1) Refresh after creating the languages collection
			.mockResolvedValueOnce(schemaAfterLanguages)
			// 2) Refresh after creating the translations collection
			.mockResolvedValueOnce(schemaAfterJunction)
			// 3) Refresh after creating relations
			.mockResolvedValueOnce(schemaAfterRelations);

		const result = await generateTranslations(
			{
				collection: 'articles',
				fields: ['title'],
			},
			{
				knex: database as any,
				schema: createSchemaWithoutLanguages(),
			},
		);

		expect(createCollectionSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'languages',
			}),
			expect.objectContaining({
				autoPurgeSystemCache: false,
				bypassLimits: true,
				bypassEmitAction: expect.any(Function),
			}),
		);

		expect(createItemsSpy).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ code: 'en-US' }),
				expect.objectContaining({ code: 'ar-SA', direction: 'rtl' }),
			]),
			expect.objectContaining({
				autoPurgeSystemCache: false,
				bypassLimits: true,
				bypassEmitAction: expect.any(Function),
			}),
		);

		expect(result).toEqual({
			created: true,
			translationsCollection: 'articles_translations',
			languagesCollection: 'languages',
			fields: ['title'],
		});
	});

	test('reuses existing languages collection without create/seed side effects', async () => {
		const schema = createBaseSchema();

		schema.collections['languages'] = createLanguagesSchema({
			name: { type: 'string' },
			direction: { type: 'string' },
		});

		const createCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne');
		const createItemsSpy = vi.spyOn(ItemsService.prototype, 'createMany');

		const schemaAfterJunction = structuredClone(schema);

		schemaAfterJunction.collections['articles_translations'] = {
			primary: 'id',
			fields: {
				id: { type: 'integer' },
				articles_id: { type: 'integer' },
				languages_code: { type: 'string' },
			},
		};

		const schemaAfterRelations = structuredClone(schemaAfterJunction);

		vi.mocked(getSchema)
			// 1) Refresh after creating the translations collection
			.mockResolvedValueOnce(schemaAfterJunction)
			// 2) Refresh after creating relations
			.mockResolvedValueOnce(schemaAfterRelations);

		await generateTranslations(
			{
				collection: 'articles',
				fields: ['title'],
			},
			{
				knex: database as any,
				schema,
			},
		);

		const createdCollections = createCollectionSpy.mock.calls.map(([payload]) => payload.collection);
		expect(createdCollections).toEqual(['articles_translations']);
		expect(createItemsSpy).not.toHaveBeenCalled();
	});

	test('rejects when languages collection is missing and createLanguagesCollection=false', async () => {
		await expect(
			generateTranslations(
				{
					collection: 'articles',
					fields: ['title'],
					createLanguagesCollection: false,
				},
				{
					knex: database as any,
					schema: createSchemaWithoutLanguages(),
				},
			),
		).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('creates junction, relations, alias field, and emits queued action events after commit', async () => {
		const schema = createBaseSchema();
		schema.collections['languages'] = createLanguagesSchema({});

		sourceFieldsMap['title'] = {
			field: 'title',
			type: 'string',
			schema: {
				default_value: 'hello',
				max_length: 191,
				numeric_precision: 8,
				numeric_scale: 2,
			},
			meta: {
				id: 22,
				collection: 'articles',
				sort: 10,
				group: 'details',
				required: true,
				hidden: true,
				readonly: true,
				note: 'Keep this',
				special: ['foo', 'cast-timestamp', 'no-data'],
			},
		};

		const createCollectionSpy = vi
			.spyOn(CollectionsService.prototype, 'createOne')
			.mockImplementation(async (_payload, opts) => {
				opts?.bypassEmitAction?.({
					event: 'test.event',
					meta: { collection: 'articles_translations' },
					context: {
						schema: {},
					} as any,
				});

				return 'ok';
			});

		const createRelationSpy = vi.spyOn(RelationsService.prototype, 'createOne');
		const createFieldSpy = vi.spyOn(FieldsService.prototype, 'createField');

		const schemaAfterJunction = structuredClone(schema);

		schemaAfterJunction.collections['articles_translations'] = {
			primary: 'id',
			fields: {
				id: { type: 'integer' },
				articles_id: { type: 'integer' },
				languages_code: { type: 'string' },
				title: { type: 'string' },
			},
		};

		const schemaAfterRelations = structuredClone(schemaAfterJunction);
		const emittedSchema = structuredClone(schemaAfterRelations);

		vi.mocked(getSchema)
			// 1) Refresh after creating the translations collection
			.mockResolvedValueOnce(schemaAfterJunction)
			// 2) Refresh after creating relations
			.mockResolvedValueOnce(schemaAfterRelations)
			// 3) Refresh after commit for nested action emission
			.mockResolvedValueOnce(emittedSchema);

		await generateTranslations(
			{
				collection: 'articles',
				fields: ['title'],
			},
			{
				knex: database as any,
				schema,
			},
		);

		const mutationOptions = createCollectionSpy.mock.calls[0]?.[1];

		expect(mutationOptions).toEqual(
			expect.objectContaining({
				autoPurgeSystemCache: false,
				bypassLimits: true,
				bypassEmitAction: expect.any(Function),
			}),
		);

		const junctionPayload = createCollectionSpy.mock.calls[0]![0] as any;
		expect(junctionPayload.collection).toBe('articles_translations');
		expect(junctionPayload.meta).toEqual({ hidden: true, icon: 'import_export' });

		const clonedField = junctionPayload.fields.find((field: any) => field.field === 'title');
		expect(clonedField).toBeTruthy();

		expect(clonedField.schema).toEqual({
			default_value: 'hello',
			max_length: 191,
			numeric_precision: 8,
			numeric_scale: 2,
			is_nullable: true,
		});

		expect(clonedField.meta.required).toBe(false);
		expect(clonedField.meta.hidden).toBe(false);
		expect(clonedField.meta.readonly).toBe(false);
		expect(clonedField.meta.special).toEqual(['foo']);
		expect(clonedField.meta).not.toHaveProperty('id');
		expect(clonedField.meta).not.toHaveProperty('collection');
		expect(clonedField.meta).not.toHaveProperty('sort');
		expect(clonedField.meta).not.toHaveProperty('group');

		expect(createRelationSpy).toHaveBeenCalledTimes(2);

		expect(createRelationSpy).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				collection: 'articles_translations',
				field: 'articles_id',
				related_collection: 'articles',
				meta: expect.objectContaining({
					one_field: 'translations',
					junction_field: 'languages_code',
				}),
				schema: { on_delete: 'SET NULL' },
			}),
			expect.objectContaining({
				autoPurgeSystemCache: false,
				bypassLimits: true,
				bypassEmitAction: expect.any(Function),
			}),
		);

		expect(createRelationSpy).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				collection: 'articles_translations',
				field: 'languages_code',
				related_collection: 'languages',
				meta: expect.objectContaining({
					one_field: null,
					junction_field: 'articles_id',
				}),
				schema: { on_delete: 'SET NULL' },
			}),
			expect.objectContaining({
				autoPurgeSystemCache: false,
				bypassLimits: true,
				bypassEmitAction: expect.any(Function),
			}),
		);

		expect(createFieldSpy).toHaveBeenCalledWith(
			'articles',
			expect.objectContaining({
				field: 'translations',
				type: 'alias',
				meta: expect.objectContaining({
					interface: 'translations',
					special: ['translations'],
					options: {
						languageField: null,
						languageDirectionField: null,
					},
				}),
			}),
			undefined,
			expect.objectContaining({
				autoPurgeSystemCache: false,
				bypassLimits: true,
				bypassEmitAction: expect.any(Function),
			}),
		);

		expect(vi.mocked(getSchema).mock.calls.length).toBe(3);
		expect(getSchema).toHaveBeenCalledWith({ database: database as any, bypassCache: true });

		expect(emitter.emitAction).toHaveBeenCalledWith(
			'test.event',
			{ collection: 'articles_translations' },
			expect.objectContaining({
				schema: emittedSchema,
			}),
		);
	});

	test('uses custom foreign key field names when provided', async () => {
		const createCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne');
		const createRelationSpy = vi.spyOn(RelationsService.prototype, 'createOne');

		const schema = createBaseSchema();
		const schemaAfterJunction = structuredClone(schema);

		schemaAfterJunction.collections['articles_translations'] = {
			primary: 'id',
			fields: {
				id: { type: 'integer' },
				article_id: { type: 'integer' },
				language_code: { type: 'string' },
				title: { type: 'string' },
			},
		};

		const schemaAfterRelations = structuredClone(schemaAfterJunction);

		vi.mocked(getSchema)
			// 1) Refresh after creating the translations collection
			.mockResolvedValueOnce(schemaAfterJunction)
			// 2) Refresh after creating relations
			.mockResolvedValueOnce(schemaAfterRelations);

		await generateTranslations(
			{
				collection: 'articles',
				fields: ['title'],
				parentFkField: 'article_id',
				languageFkField: 'language_code',
			},
			{
				knex: database as any,
				schema,
			},
		);

		const createJunctionPayload = createCollectionSpy.mock.calls[0]![0] as any;

		expect(createJunctionPayload.fields.map((field: any) => field.field)).toEqual(
			expect.arrayContaining(['id', 'article_id', 'language_code', 'title']),
		);

		expect(createRelationSpy).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				field: 'article_id',
				meta: expect.objectContaining({
					junction_field: 'language_code',
				}),
			}),
			expect.anything(),
		);

		expect(createRelationSpy).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				field: 'language_code',
				meta: expect.objectContaining({
					junction_field: 'article_id',
				}),
			}),
			expect.anything(),
		);
	});

	test('returns success when post-commit schema refresh fails after commit', async () => {
		const schema = createBaseSchema();

		const createCollectionSpy = vi
			.spyOn(CollectionsService.prototype, 'createOne')
			.mockImplementation(async (_payload, opts) => {
				opts?.bypassEmitAction?.({
					event: 'test.event',
					meta: { collection: 'articles_translations' },
					context: {
						schema: {},
					} as any,
				});

				return 'ok';
			});

		const schemaAfterJunction = structuredClone(schema);

		schemaAfterJunction.collections['articles_translations'] = {
			primary: 'id',
			fields: {
				id: { type: 'integer' },
				articles_id: { type: 'integer' },
				languages_code: { type: 'string' },
				title: { type: 'string' },
			},
		};

		const schemaAfterRelations = structuredClone(schemaAfterJunction);

		vi.mocked(getSchema)
			// 1) Refresh after creating the translations collection
			.mockResolvedValueOnce(schemaAfterJunction)
			// 2) Refresh after creating relations
			.mockResolvedValueOnce(schemaAfterRelations)
			// 3) Post-commit refresh for nested action emission fails
			.mockRejectedValueOnce(new Error('schema refresh failed'));

		const result = await generateTranslations(
			{
				collection: 'articles',
				fields: ['title'],
			},
			{
				knex: database as any,
				schema,
			},
		);

		expect(createCollectionSpy).toHaveBeenCalledTimes(1);

		expect(result).toEqual({
			created: true,
			translationsCollection: 'articles_translations',
			languagesCollection: 'languages',
			fields: ['title'],
		});

		expect(emitter.emitAction).not.toHaveBeenCalled();
	});

	test('adds cloned fields to existing junction and emits queued action events after commit', async () => {
		const schema = createSchemaWithTranslations();

		sourceFieldsMap['title'] = {
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
				sort: 5,
				group: 'content',
				required: true,
				hidden: true,
				readonly: true,
				special: ['no-data'],
				note: 'Original note',
			},
		};

		const createFieldSpy = vi
			.spyOn(FieldsService.prototype, 'createField')
			.mockImplementation(async (_collection, _field, _opts, mutationOptions) => {
				mutationOptions?.bypassEmitAction?.({
					event: 'test.event',
					meta: { collection: 'articles_translations' },
					context: {
						schema: {},
					} as any,
				});
			});

		const emittedSchema = createSchemaWithTranslations();
		vi.mocked(getSchema).mockResolvedValueOnce(emittedSchema);

		const result = await generateTranslations(
			{
				collection: 'articles',
				translationsCollection: 'articles_translations',
				fields: ['title'],
			},
			{
				knex: database as any,
				schema,
			},
		);

		expect(createFieldSpy).toHaveBeenCalledTimes(1);

		expect(createFieldSpy).toHaveBeenCalledWith(
			'articles_translations',
			expect.objectContaining({
				field: 'title',
				type: 'string',
				schema: {
					default_value: 'draft',
					max_length: 255,
					numeric_precision: null,
					numeric_scale: null,
					is_nullable: true,
				},
				meta: expect.objectContaining({
					required: false,
					hidden: false,
					readonly: false,
					special: null,
				}),
			}),
			undefined,
			expect.objectContaining({
				autoPurgeSystemCache: false,
				bypassLimits: true,
				bypassEmitAction: expect.any(Function),
			}),
		);

		expect(result).toEqual({
			created: false,
			translationsCollection: 'articles_translations',
			fields: ['title'],
		});

		expect(emitter.emitAction).toHaveBeenCalledWith(
			'test.event',
			{ collection: 'articles_translations' },
			expect.objectContaining({
				schema: emittedSchema,
			}),
		);
	});

	test('returns success when post-commit schema refresh fails after add-fields commit', async () => {
		const schema = createSchemaWithTranslations();

		const createFieldSpy = vi
			.spyOn(FieldsService.prototype, 'createField')
			.mockImplementation(async (_collection, _field, _opts, mutationOptions) => {
				mutationOptions?.bypassEmitAction?.({
					event: 'test.event',
					meta: { collection: 'articles_translations' },
					context: {
						schema: {},
					} as any,
				});
			});

		vi.mocked(getSchema).mockRejectedValueOnce(new Error('schema refresh failed'));

		const result = await generateTranslations(
			{
				collection: 'articles',
				translationsCollection: 'articles_translations',
				fields: ['title'],
			},
			{
				knex: database as any,
				schema,
			},
		);

		expect(createFieldSpy).toHaveBeenCalledTimes(1);

		expect(result).toEqual({
			created: false,
			translationsCollection: 'articles_translations',
			fields: ['title'],
		});

		expect(emitter.emitAction).not.toHaveBeenCalled();
	});
});
