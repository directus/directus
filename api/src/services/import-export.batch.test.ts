import { ErrorCode, isDirectusError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getCache } from '../cache.js';
import emitter from '../emitter.js';
import type { ImportCollectionData } from '../utils/build-import-plan.js';
import { getService } from '../utils/get-service.js';
import { ImportService } from './import-export.js';

const holder = vi.hoisted(() => ({ trx: null as any }));
const cache: { importCount?: number } = {};

// Mocks required to load import-export.js (mirrors import-export.test.ts)
vi.mock('../utils/store.js', () => ({
	useStore: () => (callback: (store: any) => void) =>
		callback({
			get: (key: 'importCount') => cache[key],
			set: (key: 'importCount', value: any) => {
				cache[key] = value;
			},
		}),
}));

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		MAX_IMPORT_ERRORS: 1000,
		EMAIL_TEMPLATES_PATH: './templates',
		EXTENSIONS_PATH: './extensions',
		IMPORT_TIMEOUT: '1m',
		IMPORT_MAX_CONCURRENCY: 10,
	}),
}));

vi.mock('../stores/notifications.js');
vi.mock('./users.js');

// Mocks for the importBatch logic
vi.mock('../utils/get-service.js', () => ({ getService: vi.fn() }));
vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));
vi.mock('../utils/transaction.js', () => ({ transaction: (_knex: any, handler: any) => handler(holder.trx) }));
vi.mock('../database/index.js', () => ({ default: vi.fn(), getDatabaseClient: vi.fn().mockReturnValue('postgres') }));

vi.mock('../cache.js', async (importOriginal) => ({
	...(await importOriginal<any>()),
	getCache: vi.fn(() => ({ cache: null })),
}));

/** Minimal chainable knex stub driven by a map of collection -> set of existing primary keys. */
function createTrx(existing: Record<string, Set<string>> = {}) {
	function builder() {
		const state: any = {};

		const b: any = {
			select: () => b,
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

				const rows = (state.inValues ?? [])
					.filter((v: unknown) => set.has(String(v)))
					.map((v: unknown) => ({ [state.inField]: v }));

				return Promise.resolve(rows).then(onFulfilled, onRejected);
			},
		};

		return b;
	}

	return { select: () => builder().select() } as any;
}

interface RunContext {
	calls: { collection: string; method: string; payload?: any; pk?: any; data?: any }[];
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
		} as any;
	});

	return ctx;
}

async function run(
	schema: SchemaOverview,
	input: ImportCollectionData[],
	options: { mode?: 'add' | 'merge'; dryRun?: boolean } = {},
	existing: Record<string, Set<string>> = {},
) {
	holder.trx = createTrx(existing);
	const ctx = setupServices(schema);
	const service = new ImportService({ knex: {} as any, schema, accountability: null });
	const result = await service.importBatch(input, options);
	return { result, calls: ctx.calls };
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getCache).mockReturnValue({ cache: null } as any);
	vi.spyOn(emitter, 'emitAction').mockImplementation(() => {});
});

describe('ImportService.importBatch', () => {
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

		expect(result.mappings).toEqual({
			authors: { '1': 'authors-new-1' },
			articles: { '10': 'articles-new-1' },
		});
	});

	test('merge mode upserts and preserves UUID primary keys', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').uuid().primary();
				c.field('name').string();
			})
			.build();

		const { result, calls } = await run(schema, [{ collection: 'authors', items: [{ id: 'uuid-1', name: 'A' }] }], {
			mode: 'merge',
		});

		expect(calls[0]).toMatchObject({ collection: 'authors', method: 'upsertOne' });
		expect(calls[0]!.payload.id).toBe('uuid-1');
		expect(result.mappings['authors']).toEqual({ 'uuid-1': 'uuid-1' });
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
		expect(result.mappings['authors']!['uuid-1']).toBe(calls[0]!.payload.id);
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

	test('throws InvalidForeignKeyError on a dangling reference', async () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
			})
			.build();

		await expect(run(schema, [{ collection: 'articles', items: [{ id: 1, author: 99 }] }])).rejects.toSatisfy((error) =>
			isDirectusError(error, ErrorCode.InvalidForeignKey),
		);
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

		expect(result.deferred).toEqual([{ collection: 'categories', field: 'parent' }]);

		for (const call of calls.filter((c) => c.method === 'createOne')) {
			expect(call.payload).not.toHaveProperty('parent');
		}

		const updates = calls.filter((c) => c.method === 'updateOne');
		expect(updates).toHaveLength(1);
		expect(updates[0]).toMatchObject({ pk: 'categories-new-2', data: { parent: 'categories-new-1' } });
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

		expect(result.dryRun).toBe(true);
		expect(result.mappings['authors']).toEqual({ '1': 'authors-new-1' });
		expect(emitter.emitAction).not.toHaveBeenCalled();
		expect(cacheClear).not.toHaveBeenCalled();
	});

	test('emits queued actions and clears cache on a committed run', async () => {
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
});
