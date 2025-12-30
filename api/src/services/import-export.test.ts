import { createErrorTracker, getHeadingsForCsvExport, ImportService } from './import-export.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../types/ast.js';
import { getService } from '../utils/get-service.js';
import { ErrorCode, ForbiddenError } from '@directus/errors';
import { createTmpFile } from '@directus/utils/node';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		MAX_IMPORT_ERRORS: 1000,
		EMAIL_TEMPLATES_PATH: './templates',
		EXTENSIONS_PATH: './extensions',
	}),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../utils/get-service.js', () => ({
	getService: vi.fn(),
}));

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('@directus/utils/node', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@directus/utils/node')>();

	return {
		...actual,
		createTmpFile: vi.fn(),
	};
});

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

describe('createErrorTracker', () => {
	test('groups errors with same field and type', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'nnull' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'nnull' },
			},
			3,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.field).toBe('email');
		expect(errors[0].extensions.type).toBe('nnull');
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0]?.type).toBe('lines');
		expect(errors[0].extensions.rows[0]?.rows).toEqual([1, 3]);
	});

	test('separates errors with different substring values', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'contains', substring: 'later' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'contains', substring: 'now' },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.substring).toBe('later');
		expect(errors[0].extensions.rows[0].rows).toEqual([1]);
		expect(errors[1].extensions.substring).toBe('now');
		expect(errors[1].extensions.rows[0].rows).toEqual([2]);
	});

	test('separates errors with different valid values', () => {
		const tracker = createErrorTracker();
		const code = 'FAILED_VALIDATION';

		tracker.addCapturedError(
			{
				code,
				message: 'test',
				extensions: { field: 'age', type: 'eq', valid: 18 },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code,
				message: 'test',
				extensions: { field: 'age', type: 'eq', valid: 21 },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.valid).toBe(18);
		expect(errors[1].extensions.valid).toBe(21);
	});

	test('converts consecutive rows to ranges', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 10; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'nnull' },
				},
				i,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0].type).toBe('range');
		expect(errors[0].extensions.rows[0].start).toBe(1);
		expect(errors[0].extensions.rows[0].end).toBe(10);
	});

	test('stops collecting errors at MAX_IMPORT_ERRORS', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 1500; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'nnull' },
				},
				i,
			);

			if (tracker.shouldStop()) break;
		}

		expect(tracker.getCount()).toBe(1000);
		expect(tracker.shouldStop()).toBe(true);
	});

	test('stops immediately on error without field', () => {
		const tracker = createErrorTracker();

		const nonFieldError = {
			code: 'INVALID_FOREIGN_KEY',
			message: 'test',
			extensions: {},
		};

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'validation failed',
				extensions: { field: 'email', type: 'nnull' },
			},
			1,
		);

		tracker.addCapturedError(nonFieldError, 2);

		expect(tracker.shouldStop()).toBe(true);
		expect(tracker.hasGenericError()).toBe(true);

		const errors: any[] = tracker.buildFinalErrors();
		expect(errors).toHaveLength(1);
		expect(errors[0]).toBe(nonFieldError);
	});

	test('separates errors with different invalid values', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'status', type: 'in', invalid: 'pending' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'status', type: 'in', invalid: 'archived' },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.invalid).toBe('pending');
		expect(errors[0].extensions.rows[0].rows).toEqual([1]);
		expect(errors[1].extensions.invalid).toBe('archived');
		expect(errors[1].extensions.rows[0].rows).toEqual([2]);
	});

	test('handles multiple error codes', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'email' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'email' },
			},
			2,
		);

		tracker.addCapturedError(
			{
				code: 'CONTAINS_NULL_VALUES',
				message: 'test',
				extensions: { field: 'name', type: 'nnull' },
			},
			3,
		);

		tracker.addCapturedError(
			{
				code: 'INVALID_FOREIGN_KEY',
				message: 'test',
				extensions: { field: 'author_id', collection: 'authors' },
			},
			4,
		);

		tracker.addCapturedError(
			{
				code: 'INVALID_FOREIGN_KEY',
				message: 'test',
				extensions: { field: 'author_id', collection: 'authors' },
			},
			5,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(3);

		const validationError = errors.find((e) => e.code === 'FAILED_VALIDATION');
		expect(validationError).toBeDefined();
		expect(validationError.extensions.field).toBe('email');
		expect(validationError.extensions.rows[0].rows).toEqual([1, 2]);

		const nullError = errors.find((e) => e.code === 'CONTAINS_NULL_VALUES');
		expect(nullError).toBeDefined();
		expect(nullError.extensions.field).toBe('name');
		expect(nullError.extensions.rows[0].rows).toEqual([3]);

		const fkError = errors.find((e) => e.code === 'INVALID_FOREIGN_KEY');
		expect(fkError).toBeDefined();
		expect(fkError.extensions.field).toBe('author_id');
		expect(fkError.extensions.rows[0].rows).toEqual([4, 5]);
	});

	test('returns empty array when no errors tracked', () => {
		const tracker = createErrorTracker();

		expect(tracker.hasErrors()).toBe(false);
		expect(tracker.getCount()).toBe(0);
		expect(tracker.shouldStop()).toBe(false);

		const errors = tracker.buildFinalErrors();
		expect(errors).toEqual([]);
	});

	test('handles mix of consecutive ranges and non-consecutive lines', () => {
		const tracker = createErrorTracker();

		const rows = [1, 2, 3, 4, 10, 15, 16, 17, 18, 25, 30];

		for (const row of rows) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				},
				row,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(3);

		const ranges = errors[0].extensions.rows.filter((r: any) => r.type === 'range');
		const lines = errors[0].extensions.rows.filter((r: any) => r.type === 'lines');

		expect(ranges).toHaveLength(2);
		expect(lines).toHaveLength(1);

		expect(ranges[0].start).toBe(1);
		expect(ranges[0].end).toBe(4);

		expect(ranges[1].start).toBe(15);
		expect(ranges[1].end).toBe(18);

		expect(lines[0].rows).toEqual([10, 25, 30]);
	});

	test('handles exactly minRangeSize consecutive rows', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 4; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				},
				i,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0].type).toBe('range');
		expect(errors[0].extensions.rows[0].start).toBe(1);
		expect(errors[0].extensions.rows[0].end).toBe(4);
	});

	test('handles less than minRangeSize consecutive rows', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 3; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				},
				i,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0].type).toBe('lines');
		expect(errors[0].extensions.rows[0].rows).toEqual([1, 2, 3]);
	});
});

describe('ImportService', () => {
	let db: Knex;
	let tracker: Tracker;
	let service: ImportService;

	const baseSchema = {
		collections: {
			test_collection: {
				singleton: false,
			},
		},
	} as any;

	beforeEach(() => {
		db = knex.default({ client: MockClient }) as unknown as Knex;
		tracker = createTracker(db);

		service = new ImportService({
			knex: db,
			schema: baseSchema,
		});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('import', () => {
		test('throws ForbiddenError for system collection when not admin', async () => {
			const importService = new ImportService({
				knex: db,
				schema: {} as any,
				accountability: createDefaultAccountability({
					admin: false,
				}),
			});

			const stream = Readable.from(['test']);

			await expect(importService.import('directus_users', 'text/csv', stream)).rejects.toThrow(ForbiddenError);
		});

		test('validates create and update permissions', async () => {
			const importService = new ImportService({
				knex: db,
				schema: baseSchema,
				accountability: createDefaultAccountability({
					admin: false,
				}),
			});

			vi.mocked(validateAccess).mockResolvedValue();

			vi.mocked(createTmpFile).mockResolvedValue({
				path: '/tmp/test.csv',
				cleanup: vi.fn().mockResolvedValue(undefined),
			} as any);

			vi.mocked(getService).mockReturnValue({
				upsertOne: vi.fn().mockResolvedValue({ id: 1 }),
			} as any);

			const stream = Readable.from(['id\n1']);

			await importService.import('test_collection', 'text/csv', stream);

			expect(validateAccess).toHaveBeenCalledTimes(2);

			expect(validateAccess).toHaveBeenNthCalledWith(
				1,
				{
					accountability: importService.accountability,
					action: 'create',
					collection: 'test_collection',
				},
				{
					schema: baseSchema,
					knex: db,
				},
			);

			expect(validateAccess).toHaveBeenNthCalledWith(
				2,
				{
					accountability: importService.accountability,
					action: 'update',
					collection: 'test_collection',
				},
				{
					schema: baseSchema,
					knex: db,
				},
			);
		});

		test('throws ForbiddenError when validateAccess fails', async () => {
			service = new ImportService({
				knex: db,
				schema: {} as any,
				accountability: createDefaultAccountability(),
			});

			vi.mocked(validateAccess).mockRejectedValueOnce(new ForbiddenError());

			const stream = Readable.from(['test']);

			await expect(service.import('test_collection', 'text/csv', stream)).rejects.toThrow(ForbiddenError);
		});

		test('throws UnsupportedMediaTypeError for unsupported mimetype', async () => {
			vi.mocked(validateAccess).mockResolvedValue();

			const stream = Readable.from(['test']);

			await expect(service.import('test_collection', 'application/pdf', stream)).rejects.toMatchObject({
				code: ErrorCode.UnsupportedMediaType,
			});
		});
	});

	describe('importCSV', () => {
		let mockCleanup: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			mockCleanup = vi.fn().mockResolvedValue(undefined);

			vi.mocked(createTmpFile).mockResolvedValue({
				path: '/tmp/test.csv',
				cleanup: mockCleanup,
			});
		});

		test('successfully imports valid CSV data', async () => {
			const mockUpsertOne = vi.fn().mockResolvedValue({ id: 1 });

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const csvData = 'id,name,email\n1,John Doe,john@example.com\n2,Jane Smith,jane@example.com';
			const stream = Readable.from([csvData]);

			await service.importCSV('test_collection', stream);

			expect(mockUpsertOne).toHaveBeenCalledTimes(2);

			expect(mockUpsertOne).toHaveBeenCalledWith(
				{ id: '1', name: 'John Doe', email: 'john@example.com' },
				expect.any(Object),
			);

			expect(mockUpsertOne).toHaveBeenCalledWith(
				{ id: '2', name: 'Jane Smith', email: 'jane@example.com' },
				expect.any(Object),
			);

			expect(mockCleanup).toHaveBeenCalled();
		});

		test('handles CSV with nested field notation', async () => {
			const mockUpsertOne = vi.fn().mockResolvedValue({ id: 1 });

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const csvData = 'id,author.name,author.email\n1,John,john@example.com';
			const stream = Readable.from([csvData]);

			await service.importCSV('test_collection', stream);

			expect(mockUpsertOne).toHaveBeenCalledWith(
				{
					id: '1',
					author: {
						name: 'John',
						email: 'john@example.com',
					},
				},
				expect.any(Object),
			);
		});

		test('stops at MAX_IMPORT_ERRORS', async () => {
			let callCount = 0;

			const mockUpsertOne = vi.fn().mockImplementation(() => {
				callCount++;
				throw {
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				};
			});

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const rows = Array.from({ length: 1500 }, (_, i) => `${i + 1},test${i}@example.com`);
			const csvData = 'id,email\n' + rows.join('\n');
			const stream = Readable.from([csvData]);

			await expect(service.importCSV('test_collection', stream)).rejects.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						code: 'FAILED_VALIDATION',
						extensions: expect.objectContaining({
							field: 'email',
						}),
					}),
				]),
			);

			expect(callCount).toBe(1000);
			expect(mockCleanup).toHaveBeenCalled();
		});

		test('imports single row into singleton collection using upsertSingleton', async () => {
			const mockUpsertSingleton = vi.fn().mockResolvedValue(1);

			const singletonService = new ImportService({
				knex: db,
				schema: {
					collections: {
						test_collection: {
							singleton: true,
						},
					},
				} as any,
			});

			vi.mocked(getService).mockReturnValue({
				upsertSingleton: mockUpsertSingleton,
			} as any);

			const csvData = 'id,name\n999,Test';
			const stream = Readable.from([csvData]);

			await singletonService.importCSV('test_collection', stream);

			expect(mockUpsertSingleton).toHaveBeenCalledTimes(1);

			expect(mockUpsertSingleton).toHaveBeenCalledWith({ id: '999', name: 'Test' }, expect.any(Object));

			expect(mockCleanup).toHaveBeenCalled();
		});

		test('rejects multiple rows for singleton collection', async () => {
			const mockUpsertSingleton = vi.fn().mockResolvedValue(1);

			const singletonService = new ImportService({
				knex: db,
				schema: {
					collections: {
						test_collection: {
							singleton: true,
						},
					},
				} as any,
			});

			vi.mocked(getService).mockReturnValue({
				upsertSingleton: mockUpsertSingleton,
			} as any);

			const csvData = 'id,name\n1,Test One\n2,Test Two';
			const stream = Readable.from([csvData]);

			await expect(singletonService.importCSV('test_collection', stream)).rejects.toMatchObject({
				code: 'INVALID_PAYLOAD',
				message: expect.stringContaining('Cannot import multiple records into singleton collection'),
			});

			expect(mockCleanup).toHaveBeenCalled();
		});

		test('stops immediately on error without field', async () => {
			const mockUpsertOne = vi.fn().mockRejectedValue({
				code: ErrorCode.InvalidForeignKey,
				message: 'test',
			});

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const csvData = 'id,name\n1,test1\n2,test2\n3,test3';
			const stream = Readable.from([csvData]);

			await expect(service.importCSV('test_collection', stream)).rejects.toEqual([
				expect.objectContaining({
					code: ErrorCode.InvalidForeignKey,
				}),
			]);

			expect(mockUpsertOne).toHaveBeenCalledTimes(1);
			expect(mockCleanup).toHaveBeenCalled();
		});

		test('handles empty CSV file', async () => {
			const mockUpsertOne = vi.fn();

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const csvData = 'id,name\n';
			const stream = Readable.from([csvData]);

			await service.importCSV('test_collection', stream);

			expect(mockUpsertOne).not.toHaveBeenCalled();
			expect(mockCleanup).toHaveBeenCalled();
		});

		test('throws Error on stream read failure', async () => {
			vi.mocked(getService).mockReturnValue({
				upsertOne: vi.fn(),
			} as any);

			const error = new Error();

			const errorStream = new Readable({
				read() {
					this.emit('error', error);
				},
			});

			await expect(service.importCSV('test_collection', errorStream)).rejects.toThrow(
				'Error while retrieving import data',
			);

			expect(mockCleanup).toHaveBeenCalled();
		});

		test('calls buildFinalErrors and throws the result', async () => {
			const mockUpsertOne = vi.fn().mockRejectedValue({
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'email' },
			});

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const csvData = 'id,email\n1,test@example.com';
			const stream = Readable.from([csvData]);

			const rejected = await service.importCSV('test_collection', stream).catch((errors) => errors);

			expect(Array.isArray(rejected)).toBe(true);
			expect(rejected.length).toBe(1);
			expect(rejected[0].code).toBe('FAILED_VALIDATION');
			expect(rejected[0]).toHaveProperty('extensions');
			expect(rejected[0].extensions).toHaveProperty('rows');
		});
	});

	describe('importJSON', () => {
		test('successfully imports valid JSON array', async () => {
			const mockUpsertOne = vi.fn().mockResolvedValue({ id: 1 });

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const data = [
				{ id: 1, name: 'John Doe', email: 'john@example.com' },
				{ id: 2, name: 'Jane Smith', email: 'jane@example.com' },
			];

			const jsonData = JSON.stringify(data);

			const stream = Readable.from([jsonData]);

			await service.importJSON('test_collection', stream);

			expect(mockUpsertOne).toHaveBeenCalledTimes(2);
			expect(mockUpsertOne).toHaveBeenCalledWith(data[0], expect.any(Object));
			expect(mockUpsertOne).toHaveBeenCalledWith(data[1], expect.any(Object));
		});

		test('imports single object into singleton collection using upsertSingleton', async () => {
			const mockUpsertSingleton = vi.fn().mockResolvedValue(1);

			const singletonService = new ImportService({
				knex: db,
				schema: {
					...baseSchema,
					collections: {
						...baseSchema.collections,
						site_settings: {
							singleton: true,
						},
					},
				},
			});

			vi.mocked(getService).mockReturnValue({
				upsertSingleton: mockUpsertSingleton,
			} as any);

			const data = [{ id: 999, site_name: 'My Site', theme: 'dark' }];
			const jsonData = JSON.stringify(data);
			const stream = Readable.from([jsonData]);

			await singletonService.importJSON('site_settings', stream);

			expect(mockUpsertSingleton).toHaveBeenCalledTimes(1);
			expect(mockUpsertSingleton).toHaveBeenCalledWith(data[0], expect.any(Object));
		});

		test('rejects multiple objects for singleton collection', async () => {
			const mockUpsertSingleton = vi.fn().mockResolvedValue(1);

			const singletonService = new ImportService({
				knex: db,
				schema: {
					...baseSchema,
					collections: {
						...baseSchema.collections,
						site_settings: {
							singleton: true,
						},
					},
				},
			});

			vi.mocked(getService).mockReturnValue({
				upsertSingleton: mockUpsertSingleton,
			} as any);

			const data = [
				{ id: 1, site_name: 'Site One', theme: 'dark' },
				{ id: 2, site_name: 'Site Two', theme: 'light' },
			];

			const jsonData = JSON.stringify(data);
			const stream = Readable.from([jsonData]);

			await expect(singletonService.importJSON('site_settings', stream)).rejects.toMatchObject({
				code: 'INVALID_PAYLOAD',
				message: expect.stringContaining('Cannot import multiple records into singleton collection'),
			});
		});

		test('handles empty JSON array', async () => {
			const mockUpsertOne = vi.fn();

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const jsonData = JSON.stringify([]);
			const stream = Readable.from([jsonData]);

			await service.importJSON('test_collection', stream);

			expect(mockUpsertOne).not.toHaveBeenCalled();
		});

		test('throws InvalidPayloadError on malformed JSON', async () => {
			vi.mocked(getService).mockReturnValue({
				upsertOne: vi.fn(),
			} as any);

			const invalidJson = '{invalid json]';
			const stream = Readable.from([invalidJson]);

			await expect(service.importJSON('test_collection', stream)).rejects.toThrow();
		});

		test('calls buildFinalErrors and throws the result', async () => {
			vi.mocked(getService).mockReturnValue({
				upsertOne: vi.fn().mockRejectedValue({
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				}),
			} as any);

			const jsonData = JSON.stringify([{ id: 1, email: 'test@example.com' }]);
			const stream = Readable.from([jsonData]);

			const rejected = await service.importJSON('test_collection', stream).catch((errors) => errors);

			expect(Array.isArray(rejected)).toBe(true);
			expect(rejected.length).toBeGreaterThan(0);
			expect(rejected[0].code).toBe('FAILED_VALIDATION');
			expect(rejected[0]).toHaveProperty('extensions');
			expect(rejected[0].extensions).toHaveProperty('rows');
		});

		test('stops immediately on generic error', async () => {
			const mockUpsertOne = vi.fn().mockRejectedValue({
				code: ErrorCode.Forbidden,
				message: 'test',
			});

			vi.mocked(getService).mockReturnValue({
				upsertOne: mockUpsertOne,
			} as any);

			const jsonData = JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]);
			const stream = Readable.from([jsonData]);

			await expect(service.importJSON('test_collection', stream)).rejects.toEqual([
				expect.objectContaining({
					code: ErrorCode.Forbidden,
				}),
			]);

			expect(mockUpsertOne).toHaveBeenCalledTimes(1);
		});
	});
});
