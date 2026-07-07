import { PassThrough, Readable } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import { ErrorCode, ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import { getService } from '../utils/get-service.js';
import { ImportService } from './import.js';
import { NotificationsService } from './notifications.js';

const cache: { importCount?: number } = {};

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
	useEnv: () => ({
		MAX_IMPORT_ERRORS: 1000,
		EMAIL_TEMPLATES_PATH: './templates',
		EXTENSIONS_PATH: './extensions',
		IMPORT_TIMEOUT: '1m',
		IMPORT_MAX_CONCURRENCY: 10,
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
