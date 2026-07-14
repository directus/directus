import { PassThrough, Readable } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import { ErrorCode, ForbiddenError, isDirectusError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, ImportCollectionData, SchemaOverview } from '@directus/types';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getCache } from '../cache.js';
import emitter from '../emitter.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import { getService } from '../utils/get-service.js';
import { ImportService } from './import.js';
import { NotificationsService } from './notifications.js';

const holder = vi.hoisted(() => ({ trx: null as any }));
const cache: { importCount?: number } = {};

const envConfig = vi.hoisted(() => ({
	MAX_IMPORT_ERRORS: 1000,
	EMAIL_TEMPLATES_PATH: './templates',
	EXTENSIONS_PATH: './extensions',
	IMPORT_TIMEOUT: '1m',
	IMPORT_MAX_CONCURRENCY: 10,
	CACHE_AUTO_PURGE: false as boolean,
}));

vi.mock('../utils/store.js', () => ({
	useStore: () => (callback: (store: any) => void) => {
		callback({
			get: (key: 'importCount') => cache[key],
			set: (key: 'importCount', value: any) => {
				cache[key] = value;
			},
		});
	},
}));

vi.mock('../stores/notifications.js');
vi.mock('./users.js');

vi.mock('@directus/env', () => ({
	useEnv: () => envConfig,
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

// importBatch drives the transaction handler against a stub trx (see createTrx)
vi.mock('../utils/transaction.js', () => ({ transaction: (_knex: any, handler: any) => handler(holder.trx) }));

vi.mock('../cache.js', async (importOriginal) => ({
	...(await importOriginal<any>()),
	getCache: vi.fn(() => ({ cache: null })),
}));

describe('ImportService', () => {
	let db: Knex;
	let tracker: Tracker;
	let service: ImportService;

	const baseSchema = new SchemaBuilder()
		.collection('test_collection', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	beforeEach(() => {
		envConfig.CACHE_AUTO_PURGE = false;

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

		test('increases the importCount by one while importing', async () => {
			service = new ImportService({
				knex: db,
				schema: baseSchema,
				accountability: createDefaultAccountability(),
			});

			const stream = new PassThrough();

			let resolve: any;

			const importCSVPromise = new Promise((res) => {
				resolve = res;
			});

			service.importCSV = async () => {
				await importCSVPromise;
			};

			stream.push('test');

			const promise = service.import('test_collection', 'text/csv', stream);

			await setTimeout(1);

			expect(cache.importCount).toEqual(1);

			resolve();

			await promise;

			expect(cache.importCount).toEqual(0);
		});

		test('resets the counter even if import errors', async () => {
			service = new ImportService({
				knex: db,
				schema: baseSchema,
				accountability: createDefaultAccountability(),
			});

			const stream = new PassThrough();

			let reject: any;

			const importCSVPromise = new Promise((_res, rej) => {
				reject = rej;
			});

			service.importCSV = async () => {
				await importCSVPromise;
			};

			stream.push('test');

			const promise = service.import('test_collection', 'text/csv', stream);

			await setTimeout(1);

			expect(cache.importCount).toEqual(1);

			reject();

			await expect(async () => await promise).rejects.toThrowError();

			expect(cache.importCount).toEqual(0);
		});

		test('importing in background', async () => {
			service = new ImportService({
				knex: db,
				schema: baseSchema,
				accountability: {
					...createDefaultAccountability(),
					user: 'fake-user',
				},
			});

			let resolve: any;

			const notifyPromise = new Promise((res) => {
				resolve = res;
			});

			NotificationsService.prototype.createOne = vi.fn().mockImplementation(() => {
				resolve();
			});

			const stream = new PassThrough();

			stream.push('test');

			const promise = service.import('test_collection', 'text/csv', stream, { background: true });

			stream.end('finish');

			await expect(promise).resolves.toBeUndefined();

			await notifyPromise;

			expect(NotificationsService.prototype.createOne).toHaveBeenLastCalledWith({
				message: `Hello Unknown User,\n\nYour import in test_collection has been successful.\n`,
				recipient: 'fake-user',
				sender: 'fake-user',
				subject: 'Your import has been successful',
			});
		});

		test('importing in background failing', async () => {
			service = new ImportService({
				knex: db,
				schema: baseSchema,
				accountability: {
					...createDefaultAccountability(),
					user: 'fake-user',
				},
			});

			let resolve: any;

			const notifyPromise = new Promise((res) => {
				resolve = res;
			});

			NotificationsService.prototype.createOne = vi.fn().mockImplementation(() => {
				resolve();
			});

			service.importCSV = async () => {
				throw new Error();
			};

			const stream = new PassThrough();

			stream.push('test');

			const promise = service.import('test_collection', 'text/csv', stream, { background: true });

			stream.end('finish');

			await expect(promise).resolves.toBeUndefined();

			await notifyPromise;

			expect(NotificationsService.prototype.createOne).toHaveBeenLastCalledWith({
				message: `Hello Unknown User,\n\nYour import in test_collection has failed.\n\n\n`,
				recipient: 'fake-user',
				sender: 'fake-user',
				subject: 'Your import has failed',
			});
		});
	});

	describe('importCSV', () => {
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

/** Minimal chainable knex stub driven by a map of collection -> set of existing primary keys. */
function createTrx(existing: Record<string, Set<string>> = {}) {
	function builder() {
		const state: any = {};

		const b: any = {
			select: (field?: string) => {
				if (field !== undefined) state.selectField = field;
				return b;
			},
			from: (collection: string) => {
				state.collection = collection;
				return b;
			},
			where: (obj: Record<string, unknown>) => {
				state.where = obj;
				return b;
			},
			whereIn: (field: string, values: unknown[]) => {
				state.inField = field;
				state.inValues = values;
				return b;
			},
			first: () => {
				const set = existing[state.collection] ?? new Set();
				const value = String(Object.values(state.where)[0]);
				return Promise.resolve(set.has(value) ? { found: true } : undefined);
			},
			then: (onFulfilled: any, onRejected: any) => {
				const set = existing[state.collection] ?? new Set();
				const field = state.inField ?? state.selectField;

				// whereIn filters the provided values; a plain select returns every existing key
				const source = state.inValues ?? [...set];

				const rows = source.filter((v: unknown) => set.has(String(v))).map((v: unknown) => ({ [field]: v }));

				return Promise.resolve(rows).then(onFulfilled, onRejected);
			},
		};

		return b;
	}

	return { select: (field?: string) => builder().select(field) } as any;
}

interface RunContext {
	calls: { collection: string; method: string; payload?: any; pk?: any; data?: any; keys?: any }[];
}

function setupServices(schema: SchemaOverview): RunContext {
	const ctx: RunContext = { calls: [] };
	const autoCounters: Record<string, number> = {};

	vi.mocked(getService).mockImplementation((collection: string) => {
		const pkField = schema.collections[collection]!.primary;

		return {
			createMutationTracker: () => ({}),
			createOne: vi.fn(async (payload: Record<string, any>) => {
				ctx.calls.push({ collection, method: 'createOne', payload });
				if (payload[pkField] !== undefined) return payload[pkField];
				autoCounters[collection] = (autoCounters[collection] ?? 0) + 1;
				return `${collection}-new-${autoCounters[collection]}`;
			}),
			upsertOne: vi.fn(async (payload: Record<string, any>) => {
				ctx.calls.push({ collection, method: 'upsertOne', payload });
				return payload[pkField];
			}),
			updateOne: vi.fn(async (pk: any, data: Record<string, any>) => {
				ctx.calls.push({ collection, method: 'updateOne', pk, data });
				return pk;
			}),
			deleteMany: vi.fn(async (keys: any[]) => {
				ctx.calls.push({ collection, method: 'deleteMany', keys });
				return keys;
			}),
			deleteByQuery: vi.fn(async (query: any) => {
				// Mirror `deleteByQuery`: read every existing key, then delete those not kept by `_nin`.
				const rows = await holder.trx.select(pkField).from(collection);
				const allKeys = rows.map((row: any) => row[pkField]);
				const nin: any[] | undefined = query?.filter?.[pkField]?._nin;
				const keptSet = new Set((nin ?? []).map((value: unknown) => String(value)));
				const toDelete = allKeys.filter((key: unknown) => !keptSet.has(String(key)));
				if (toDelete.length > 0) ctx.calls.push({ collection, method: 'deleteByQuery', keys: toDelete });
				return toDelete;
			}),
		} as any;
	});

	return ctx;
}

async function run(
	schema: SchemaOverview,
	input: ImportCollectionData[],
	options: { mode?: 'add' | 'merge'; dryRun?: boolean; dangerouslyAllowDelete?: boolean } = {},
	existing: Record<string, Set<string>> = {},
	accountability: Accountability | null = null,
) {
	holder.trx = createTrx(existing);
	const ctx = setupServices(schema);
	const service = new ImportService({ knex: {} as any, schema, accountability });
	const result = await service.importBatch(input, options);
	return { result, calls: ctx.calls };
}

describe('ImportService.importBatch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getCache).mockReturnValue({ cache: null } as any);
		vi.spyOn(emitter, 'emitAction').mockImplementation(() => {});
	});

	test('imports in dependency order and remaps auto-increment PKs + FKs', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('title').string();
				c.field('author').m2o('authors');
			})
			.build();

		const { result, calls } = await run(schema, [
			{ collection: 'articles', items: [{ id: 10, title: 'T', author: 1 }] },
			{ collection: 'authors', items: [{ id: 1, name: 'A' }] },
		]);

		expect(calls.map((c) => c.collection)).toEqual(['authors', 'articles']);

		expect(calls[0]).toMatchObject({ collection: 'authors', method: 'createOne' });
		expect(calls[0]!.payload).not.toHaveProperty('id');

		expect(calls[1]!.payload.author).toBe('authors-new-1');
		expect(calls[1]!.payload).not.toHaveProperty('id');

		expect(result.applied).toBe(true);

		expect(result.collections['authors']).toEqual({
			existing: [],
			new: ['authors-new-1'],
			deleted: [],
			mapped: { '1': 'authors-new-1' },
		});

		expect(result.collections['articles']).toEqual({
			existing: [],
			new: ['articles-new-1'],
			deleted: [],
			mapped: { '10': 'articles-new-1' },
		});
	});

	test('merge mode upserts a pre-existing UUID row as "existing"', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		const { result, calls } = await run(
			schema,
			[{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }],
			{ mode: 'merge' },
			{ authors: new Set(['uuid-1']) },
		);

		expect(calls[0]).toMatchObject({ collection: 'authors', method: 'upsertOne' });
		expect(calls[0]!.payload.id).toBe('uuid-1');
		// matched an existing row: reported under existing, no remap
		expect(result.collections['authors']).toEqual({ existing: ['uuid-1'], new: [], deleted: [], mapped: {} });
	});

	test('merge mode inserts a new UUID row as "new" (preserving the key)', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		const { result } = await run(schema, [{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }], {
			mode: 'merge',
		});

		expect(result.collections['authors']).toEqual({ existing: [], new: ['uuid-1'], deleted: [], mapped: {} });
	});

	test('merge mode updates a pre-existing auto-increment row in place, keeping its id', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		const { result, calls } = await run(
			schema,
			[{ collection: 'authors', items: [{ id: 5, name: 'A' }] }],
			{ mode: 'merge' },
			{ authors: new Set(['5']) },
		);

		// Existing key: upsert in place, no remap
		expect(calls[0]).toMatchObject({ collection: 'authors', method: 'upsertOne' });
		expect(calls[0]!.payload.id).toBe(5);
		expect(result.collections['authors']).toEqual({ existing: [5], new: [], deleted: [], mapped: {} });
	});

	test('merge mode remaps a non-existent auto-increment key to keep the sequence intact', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		const { result, calls } = await run(schema, [{ collection: 'authors', items: [{ id: 99, name: 'A' }] }], {
			mode: 'merge',
		});

		// Non-existent key: dropped and re-created so the sequence assigns a fresh id
		expect(calls[0]).toMatchObject({ collection: 'authors', method: 'createOne' });
		expect(calls[0]!.payload).not.toHaveProperty('id');

		expect(result.collections['authors']).toEqual({
			existing: [],
			new: ['authors-new-1'],
			deleted: [],
			mapped: { '99': 'authors-new-1' },
		});
	});

	test('add mode regenerates a conflicting UUID primary key', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		const { result, calls } = await run(
			schema,
			[{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }],
			{ mode: 'add' },
			{ authors: new Set(['uuid-1']) },
		);

		expect(calls[0]!.method).toBe('createOne');
		expect(calls[0]!.payload.id).not.toBe('uuid-1');
		expect(typeof calls[0]!.payload.id).toBe('string');

		const authorsResult = result.collections['authors']!;
		expect(authorsResult.mapped['uuid-1']).toBe(calls[0]!.payload.id);
		expect(authorsResult.new).toEqual([calls[0]!.payload.id]);
		expect(authorsResult.existing).toEqual([]);
	});

	test('add mode throws on a conflicting non-UUID string primary key', async () => {
		const schema = new SchemaBuilder()
			.collection('tags', (c) => {
				c.field('code').string().primary();
				c.field('label').string();
			})
			.build();

		await expect(
			run(
				schema,
				[{ collection: 'tags', items: [{ code: 'A', label: 'Alpha' }] }],
				{ mode: 'add' },
				{
					tags: new Set(['A']),
				},
			),
		).rejects.toSatisfy((error) => isDirectusError(error, ErrorCode.InvalidPayload));
	});

	test('rejects nested m2o object payloads', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
			})
			.build();

		await expect(run(schema, [{ collection: 'articles', items: [{ id: 1, author: { id: 2 } }] }])).rejects.toSatisfy(
			(error) => isDirectusError(error, ErrorCode.InvalidPayload),
		);
	});

	test('rejects nested o2m array payloads', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('articles').o2m('articles', 'author');
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
			})
			.build();

		await expect(run(schema, [{ collection: 'authors', items: [{ id: 1, articles: [{ id: 2 }] }] }])).rejects.toSatisfy(
			(error) => isDirectusError(error, ErrorCode.InvalidPayload),
		);
	});

	test('does not flag json objects or csv arrays as nested relations', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.collection('posts', (c) => {
				c.field('id').id();
				c.field('meta').json();
				c.field('tags').csv();
				c.field('author').m2o('authors');
			})
			.build();

		const { calls } = await run(schema, [
			{ collection: 'authors', items: [{ id: 1 }] },
			{ collection: 'posts', items: [{ id: 1, meta: { a: 1 }, tags: ['x', 'y'], author: 1 }] },
		]);

		const postCall = calls.find((c) => c.collection === 'posts')!;
		expect(postCall.payload.meta).toEqual({ a: 1 });
		expect(postCall.payload.tags).toEqual(['x', 'y']);
		expect(postCall.payload.author).toBe('authors-new-1');
	});

	test('accepts references satisfied by pre-existing database rows', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
			})
			.build();

		const { calls } = await run(
			schema,
			[{ collection: 'articles', items: [{ id: 1, author: 5 }] }],
			{},
			{ authors: new Set(['5']) },
		);

		expect(calls[0]!.payload.author).toBe(5);
	});

	test('resolves a nullable self-reference with a second pass', async () => {
		const schema = new SchemaBuilder()
			.collection('categories', (c) => {
				c.field('id').id();
				c.field('name').string();
				c.field('parent').m2o('categories');
			})
			.build();

		const { result, calls } = await run(schema, [
			{
				collection: 'categories',
				items: [
					{ id: 1, name: 'root', parent: null },
					{ id: 2, name: 'child', parent: 1 },
				],
			},
		]);

		// parent is deferred: stripped on insert, then set in a second-pass update
		for (const call of calls.filter((c) => c.method === 'createOne')) {
			expect(call.payload).not.toHaveProperty('parent');
		}

		const updates = calls.filter((c) => c.method === 'updateOne');
		expect(updates).toHaveLength(1);
		expect(updates[0]).toMatchObject({ pk: 'categories-new-2', data: { parent: 'categories-new-1' } });

		expect(result.collections['categories']!.mapped).toEqual({ '1': 'categories-new-1', '2': 'categories-new-2' });
	});

	test('dry run computes mappings without emitting actions or clearing cache', async () => {
		const cacheClear = vi.fn();
		vi.mocked(getCache).mockReturnValue({ cache: { clear: cacheClear } } as any);

		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		const { result } = await run(schema, [{ collection: 'authors', items: [{ id: 1, name: 'A' }] }], {
			mode: 'add',
			dryRun: true,
		});

		expect(result.applied).toBe(false);

		expect(result.collections['authors']).toEqual({
			existing: [],
			new: ['authors-new-1'],
			deleted: [],
			mapped: { '1': 'authors-new-1' },
		});

		expect(emitter.emitAction).not.toHaveBeenCalled();
		expect(cacheClear).not.toHaveBeenCalled();
	});

	test('emits queued actions and clears cache on a committed run when CACHE_AUTO_PURGE is enabled', async () => {
		envConfig.CACHE_AUTO_PURGE = true;

		const cacheClear = vi.fn();
		vi.mocked(getCache).mockReturnValue({ cache: { clear: cacheClear } } as any);

		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		await run(schema, [{ collection: 'authors', items: [{ id: 1, name: 'A' }] }], { mode: 'add' });

		expect(cacheClear).toHaveBeenCalledTimes(1);
	});

	test('does not clear cache on a committed run when CACHE_AUTO_PURGE is disabled', async () => {
		envConfig.CACHE_AUTO_PURGE = false;

		const cacheClear = vi.fn();
		vi.mocked(getCache).mockReturnValue({ cache: { clear: cacheClear } } as any);

		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		await run(schema, [{ collection: 'authors', items: [{ id: 1, name: 'A' }] }], { mode: 'add' });

		expect(cacheClear).not.toHaveBeenCalled();
	});

	test('dangerouslyAllowDelete removes existing rows absent from a merge import', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		const { result, calls } = await run(
			schema,
			[{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }],
			{ mode: 'merge', dangerouslyAllowDelete: true },
			{ authors: new Set(['uuid-1', 'uuid-2', 'uuid-3']) },
		);

		// uuid-1 is upserted (kept); uuid-2 and uuid-3 are absent from the import so they're deleted
		const deleteCall = calls.find((c) => c.method === 'deleteByQuery');
		expect(deleteCall).toMatchObject({ collection: 'authors' });
		expect(new Set(deleteCall!.keys)).toEqual(new Set(['uuid-2', 'uuid-3']));
		expect(new Set(result.collections['authors']!.deleted)).toEqual(new Set(['uuid-2', 'uuid-3']));
	});

	test('dangerouslyAllowDelete deletes children before parents (reverse dependency order)', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.collection('articles', (c) => {
				c.field('id').uuid().primary();
				c.field('title').string();
				c.field('author').m2o('authors');
			})
			.build();

		const { calls } = await run(
			schema,
			[
				{ collection: 'authors', items: [{ id: 'a1', name: 'A' }] },
				{ collection: 'articles', items: [{ id: 'art1', title: 'T', author: 'a1' }] },
			],
			{ mode: 'merge', dangerouslyAllowDelete: true },
			{ authors: new Set(['a1', 'a2']), articles: new Set(['art1', 'art2']) },
		);

		const deleteOrder = calls.filter((c) => c.method === 'deleteByQuery').map((c) => c.collection);
		// articles (child) must be deleted before authors (parent) to avoid FK violations
		expect(deleteOrder).toEqual(['articles', 'authors']);
	});

	test('dangerouslyAllowDelete performs no deletes when every existing row is kept', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		const { calls, result } = await run(
			schema,
			[{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }],
			{ mode: 'merge', dangerouslyAllowDelete: true },
			{ authors: new Set(['uuid-1']) },
		);

		expect(calls.some((c) => c.method === 'deleteByQuery')).toBe(false);
		expect(result.collections['authors']!.deleted).toEqual([]);
	});

	test('dangerouslyAllowDelete rolls back deletes on a dry run', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		const { result, calls } = await run(
			schema,
			[{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }],
			{ mode: 'merge', dangerouslyAllowDelete: true, dryRun: true },
			{ authors: new Set(['uuid-1', 'uuid-2']) },
		);

		// Deletes are still exercised inside the transaction, then rolled back with everything else
		expect(calls.some((c) => c.method === 'deleteByQuery')).toBe(true);
		expect(result.applied).toBe(false);
	});

	test('dangerouslyAllowDelete is rejected without merge mode', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		await expect(
			run(schema, [{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }], {
				mode: 'add',
				dangerouslyAllowDelete: true,
			}),
		).rejects.toMatchObject({ code: ErrorCode.InvalidQuery });
	});

	test('remaps an a2o foreign key via the per-item target collection', async () => {
		const schema = new SchemaBuilder()
			.collection('paragraph', (c) => {
				c.field('id').id();
				c.field('text').string();
			})
			.collection('image', (c) => {
				c.field('id').id();
				c.field('src').string();
			})
			.collection('blog', (c) => {
				c.field('id').id();
				c.field('blocks').a2o(['paragraph', 'image']);
			})
			.build();

		const { calls } = await run(schema, [
			{ collection: 'paragraph', items: [{ id: 1, text: 'hello' }] },
			{ collection: 'image', items: [{ id: 1, src: 'a.png' }] },
			{
				collection: 'blog',
				items: [
					{ id: 1, blocks: 1, collection: 'paragraph' },
					{ id: 2, blocks: 1, collection: 'image' },
				],
			},
		]);

		const blogCreates = calls.filter((c) => c.collection === 'blog' && c.method === 'createOne');

		// Same raw fk (1) resolves to a different target based on each item's collection field
		expect(blogCreates[0]!.payload.blocks).toBe('paragraph-new-1');
		expect(blogCreates[1]!.payload.blocks).toBe('image-new-1');
	});

	describe('permissions', () => {
		test('throws ForbiddenError for a system collection when not admin', async () => {
			const schema = new SchemaBuilder()
				.collection('directus_dashboards', (c) => {
					c.field('id').uuid().primary();
					c.field('name').string();
				})
				.build();

			await expect(
				run(
					schema,
					[{ collection: 'directus_dashboards', items: [{ id: 'x', name: 'n' }] }],
					{},
					{},
					createDefaultAccountability({ admin: false }),
				),
			).rejects.toThrow(ForbiddenError);
		});

		test('validates create but not update permission in add mode', async () => {
			const schema = new SchemaBuilder()
				.collection('authors', (c) => {
					c.field('id').id();
					c.field('name').string();
				})
				.build();

			await run(
				schema,
				[{ collection: 'authors', items: [{ id: 1, name: 'A' }] }],
				{},
				{},
				createDefaultAccountability({ admin: false }),
			);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'create', collection: 'authors' }),
				expect.anything(),
			);

			expect(validateAccess).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }), expect.anything());
		});

		test('validates update permission in merge mode', async () => {
			const schema = new SchemaBuilder()
				.collection('authors', (c) => {
					c.field('id').id();
					c.field('name').string();
				})
				.build();

			await run(
				schema,
				[{ collection: 'authors', items: [{ id: 1, name: 'A' }] }],
				{ mode: 'merge' },
				{},
				createDefaultAccountability({ admin: false }),
			);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'update', collection: 'authors' }),
				expect.anything(),
			);
		});

		test('validates update permission for a deferred field even in add mode', async () => {
			const schema = new SchemaBuilder()
				.collection('categories', (c) => {
					c.field('id').id();
					c.field('name').string();
					c.field('parent').m2o('categories');
				})
				.build();

			await run(
				schema,
				[{ collection: 'categories', items: [{ id: 1, name: 'root', parent: null }] }],
				{},
				{},
				createDefaultAccountability({ admin: false }),
			);

			// categories.parent is deferred (nullable self-reference), so the second pass needs update access
			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'update', collection: 'categories' }),
				expect.anything(),
			);
		});

		test('validates delete permission when dangerouslyAllowDelete is set', async () => {
			const schema = new SchemaBuilder()
				.collection('authors', (c) => {
					c.field('id').uuid().primary();
					c.field('name').string();
				})
				.build();

			await run(
				schema,
				[{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }],
				{ mode: 'merge', dangerouslyAllowDelete: true },
				{ authors: new Set(['uuid-1']) },
				createDefaultAccountability({ admin: false }),
			);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'delete', collection: 'authors' }),
				expect.anything(),
			);
		});

		test('does not check delete permission without dangerouslyAllowDelete', async () => {
			const schema = new SchemaBuilder()
				.collection('authors', (c) => {
					c.field('id').uuid().primary();
					c.field('name').string();
				})
				.build();

			await run(
				schema,
				[{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }],
				{ mode: 'merge' },
				{},
				createDefaultAccountability({ admin: false }),
			);

			expect(validateAccess).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }), expect.anything());
		});

		test('rejects when validateAccess denies a collection', async () => {
			const schema = new SchemaBuilder()
				.collection('authors', (c) => {
					c.field('id').id();
					c.field('name').string();
				})
				.build();

			vi.mocked(validateAccess).mockRejectedValueOnce(new ForbiddenError());

			await expect(
				run(
					schema,
					[{ collection: 'authors', items: [{ id: 1, name: 'A' }] }],
					{},
					{},
					createDefaultAccountability({ admin: false }),
				),
			).rejects.toThrow(ForbiddenError);
		});
	});
});
