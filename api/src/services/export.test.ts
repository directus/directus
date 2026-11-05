import type { SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../types/ast.js';
import { ExportService, getHeadingsForCsvExport } from './export.js';

const uploadOne = vi.hoisted(() => vi.fn());

vi.mock('./files.js', () => ({
	FilesService: class {
		uploadOne = uploadOne;
	},
}));

vi.mock('../utils/get-service.js', () => ({
	getService: () => ({ readByQuery: vi.fn().mockResolvedValue([{ count: 0 }]) }),
}));

vi.mock('../utils/transaction.js', () => ({
	transaction: (_knex: unknown, callback: (trx: unknown) => unknown) => callback({}),
}));

vi.mock('@directus/utils/node', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/utils/node')>()),
	createTmpFile: vi.fn().mockResolvedValue({ path: '/tmp/export', cleanup: vi.fn() }),
}));

vi.mock('node:fs', async (importOriginal) => ({
	...(await importOriginal<typeof import('node:fs')>()),
	createReadStream: vi.fn(),
}));

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		EMAIL_TEMPLATES_PATH: './templates',
		EXTENSIONS_PATH: './extensions',
	}),
}));

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

test('Get the headings for CSV export from the field node tree', () => {
	/**
	 * this is an example result from parseFields
	 * It includes the following:
	 * - a field node
	 * - a m2o node with a nested m2o node
	 * - a o2m node
	 * - a o2m node which is the parsing result of a m2a relationship
	 */

	const parsedFields: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
		{
			type: 'field',
			name: 'id',
			fieldKey: 'id',
			whenCase: [],
			alias: false,
		},
		{
			type: 'field',
			name: 'title',
			fieldKey: 'title',
			whenCase: [],
			alias: false,
		},
		{
			type: 'm2o',
			name: 'authors',
			fieldKey: 'author',
			parentKey: 'id',
			relatedKey: 'id',
			relation: {
				collection: 'articles',
				field: 'author',
				related_collection: 'authors',
				schema: {
					constraint_name: 'articles_author_foreign',
					table: 'articles',
					column: 'author',
					foreign_key_schema: 'public',
					foreign_key_table: 'authors',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 1,
					many_collection: 'articles',
					many_field: 'author',
					one_collection: 'authors',
					one_field: null,
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			query: {},
			children: [
				{
					type: 'field',
					name: 'id',
					fieldKey: 'id',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'first_name',
					fieldKey: 'first_name',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'last_name',
					fieldKey: 'last_name',
					whenCase: [],
					alias: false,
				},
				{
					type: 'm2o',
					name: 'addresses',
					fieldKey: 'address',
					parentKey: 'id',
					relatedKey: 'id',
					relation: {
						collection: 'addresses',
						field: 'address',
						related_collection: 'authors',
						schema: {
							constraint_name: 'articles_author_foreign',
							table: 'articles',
							column: 'author',
							foreign_key_schema: 'public',
							foreign_key_table: 'authors',
							foreign_key_column: 'id',
							on_update: 'NO ACTION',
							on_delete: 'SET NULL',
						},
						meta: {
							id: 1,
							many_collection: 'articles',
							many_field: 'author',
							one_collection: 'authors',
							one_field: null,
							one_collection_field: null,
							one_allowed_collections: null,
							junction_field: null,
							sort_field: null,
							one_deselect_action: 'nullify',
						},
					},
					query: {},
					children: [
						{
							type: 'field',
							name: 'id',
							fieldKey: 'id',
							whenCase: [],
							alias: false,
						},
						{
							type: 'field',
							name: 'street',
							fieldKey: 'street',
							whenCase: [],
							alias: false,
						},
						{
							type: 'field',
							name: 'city',
							fieldKey: 'city',
							whenCase: [],
							alias: false,
						},
					],
					cases: [],
					whenCase: [],
				},
			],
			cases: [],
			whenCase: [],
		},
		{
			type: 'o2m',
			name: 'headlines',
			fieldKey: 'headings',
			parentKey: 'id',
			relatedKey: 'id',
			relation: {
				collection: 'headlines',
				field: 'article',
				related_collection: 'articles',
				schema: {
					constraint_name: 'headlines_article_foreign',
					table: 'headlines',
					column: 'article',
					foreign_key_schema: 'public',
					foreign_key_table: 'articles',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 3,
					many_collection: 'headlines',
					many_field: 'article',
					one_collection: 'articles',
					one_field: 'headings',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			query: {
				sort: ['id'],
			},
			children: [
				{
					type: 'field',
					name: 'id',
					fieldKey: 'id',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'title',
					fieldKey: 'title',
					whenCase: [],
					alias: false,
				},
			],
			cases: [],
			whenCase: [],
		},
		{
			type: 'o2m',
			name: 'articles_m2a',
			fieldKey: 'some-m2a',
			parentKey: 'id',
			relatedKey: 'id',
			relation: {
				collection: 'articles_m2a',
				field: 'articles_id',
				related_collection: 'articles',
				schema: {
					constraint_name: 'articles_m2a_articles_id_foreign',
					table: 'articles_m2a',
					column: 'articles_id',
					foreign_key_schema: 'public',
					foreign_key_table: 'articles',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 5,
					many_collection: 'articles_m2a',
					many_field: 'articles_id',
					one_collection: 'articles',
					one_field: 'some-m2a',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: 'item',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			query: {
				sort: ['id'],
			},
			children: [
				{
					type: 'field',
					name: 'id',
					fieldKey: 'id',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'articles_id',
					fieldKey: 'articles_id',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'item',
					fieldKey: 'item',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'collection',
					fieldKey: 'collection',
					whenCase: [],
					alias: false,
				},
			],
			cases: [],
			whenCase: [],
		},
	];

	const res = getHeadingsForCsvExport(parsedFields);

	const expectedHeadlinesForCsvExport = [
		'id',
		'title',

		// headings for m2o node with another nested m2o node
		'author.id',
		'author.first_name',
		'author.last_name',
		'author.address.id',
		'author.address.street',
		'author.address.city',

		// headings for the o2m nodes
		'headings',
		'some-m2a',
	];

	expect(res).toEqual(expectedHeadlinesForCsvExport);
});

describe('exportToFile folder', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	const schema = { collections: { articles: { primary: 'id' } } } as unknown as SchemaOverview;

	beforeEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
		uploadOne.mockReset();
	});

	test('uses the default exports folder when no folder is specified', async () => {
		tracker.on.select('directus_settings').response([{ default_exports_folder: 'exports-folder' }]);

		await new ExportService({ knex: db, schema, accountability: null }).exportToFile('articles', {}, 'csv');

		expect(uploadOne).toHaveBeenCalledWith(undefined, expect.objectContaining({ folder: 'exports-folder' }));
	});

	test('leaves the folder unset when there is no default exports folder', async () => {
		tracker.on.select('directus_settings').response([{ default_exports_folder: null }]);

		await new ExportService({ knex: db, schema, accountability: null }).exportToFile('articles', {}, 'csv');

		expect(uploadOne.mock.calls[0]![1]).not.toHaveProperty('folder');
	});

	test('keeps an explicitly specified folder, including the root', async () => {
		tracker.on.select('directus_settings').response([{ default_exports_folder: 'exports-folder' }]);

		await new ExportService({ knex: db, schema, accountability: null }).exportToFile('articles', {}, 'csv', {
			file: { folder: null },
		});

		expect(uploadOne).toHaveBeenCalledWith(undefined, expect.objectContaining({ folder: null }));
		expect(tracker.history.select).toHaveLength(0);
	});
});
