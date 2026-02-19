import type {
	Snapshot,
	SnapshotCollection,
	SnapshotDiff,
	SnapshotField,
	SnapshotRelation,
	SnapshotSystemField,
} from '@directus/types';
import { DiffKind } from '@directus/types';
import type { Diff } from 'deep-diff';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { snapshotApplyTestSchema } from '../__utils__/schemas.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import type { Collection } from '../types/collection.js';
import { applyDiff, isNestedMetaUpdate } from './apply-diff.js';
import * as getSchema from './get-schema.js';

vi.mock('../cache.js', () => ({
	flushCaches: vi.fn(),
	getCache: vi.fn(() => ({
		cache: null,
		systemCache: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
		},
		localSchemaCache: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
		},
		lockCache: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
		},
	})),
}));

vi.mock('../emitter.js', () => ({
	default: {
		emitAction: vi.fn(),
	},
}));

class Client_PG extends MockClient {}

describe('isNestedMetaUpdate', () => {
	it.each([
		{ kind: 'E', path: ['meta', 'options', 'option_a'], rhs: {} },
		{ kind: 'A', path: ['meta', 'options', 'option_a'], rhs: [] },
	] as Diff<SnapshotField>[])('Returns false when diff is kind $kind', (diff) => {
		expect(isNestedMetaUpdate(diff)).toBe(false);
	});

	it.each([
		{ kind: 'N', path: ['schema', 'default_value'], rhs: {} },
		{ kind: 'D', path: ['schema'], lhs: {} },
	] as Diff<SnapshotField>[])('Returns false when diff path is not nested in meta', (diff) => {
		expect(isNestedMetaUpdate(diff)).toBe(false);
	});

	it.each([
		{ kind: 'N', path: ['meta', 'options', 'option_a'], rhs: { test: 'value' } },
		{ kind: 'D', path: ['meta', 'options', 'option_b'], lhs: {} },
	] as Diff<SnapshotField>[])('Returns true when diff path is nested in meta', (diff) => {
		expect(isNestedMetaUpdate(diff)).toBe(true);
	});
});

describe('applyDiff', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	const mutationOptions = {
		autoPurgeSystemCache: false,
		bypassEmitAction: expect.any(Function),
		bypassLimits: true,
	};

	beforeEach(() => {
		db = vi.mocked(knex.default({ client: Client_PG }));
		tracker = createTracker(db);
		vi.spyOn(getSchema, 'getSchema').mockResolvedValue(snapshotApplyTestSchema);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('Collections', () => {
		it('Creates new top-level collection', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [
					{
						collection: 'test_collection',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									meta: { group: null },
									schema: { name: 'test_collection' },
								} as Collection,
							},
						],
					},
				],
				fields: [
					{
						collection: 'test_collection',
						field: 'id',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									field: 'id',
									type: 'integer',
									meta: {},
									schema: { is_primary_key: true },
								} as SnapshotField,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(createOneCollectionSpy).toHaveBeenCalledTimes(1);

			expect(createOneCollectionSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					collection: 'test_collection',
					fields: expect.arrayContaining([
						expect.objectContaining({
							collection: 'test_collection',
							field: 'id',
						}),
					]),
				}),
				mutationOptions,
			);
		});

		it('Creates nested collection when parent exists', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [
					{
						collection: 'parent_collection',
						meta: { group: null },
						schema: { name: 'parent_collection' },
					} as SnapshotCollection,
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [
					{
						collection: 'nested_collection',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'nested_collection',
									meta: { group: 'parent_collection' },
									schema: { name: 'nested_collection' },
								} as Collection,
							},
						],
					},
				],
				fields: [
					{
						collection: 'nested_collection',
						field: 'id',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'nested_collection',
									field: 'id',
									type: 'integer',
									meta: {},
									schema: { is_primary_key: true },
								} as SnapshotField,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(createOneCollectionSpy).toHaveBeenCalledTimes(1);

			expect(createOneCollectionSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					collection: 'nested_collection',
				}),
				mutationOptions,
			);
		});

		it('Updates existing collection metadata', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [
					{
						collection: 'test_collection',
						meta: { icon: 'box', hidden: false },
						schema: { name: 'test_collection' },
					} as SnapshotCollection,
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [
					{
						collection: 'test_collection',
						diff: [
							{
								kind: DiffKind.EDIT,
								path: ['meta', 'icon'],
								lhs: 'box' as any,
								rhs: 'table' as any,
							},
						],
					},
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const updateOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'updateOne').mockResolvedValue('test');

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(updateOneCollectionSpy).toHaveBeenCalledTimes(1);

			expect(updateOneCollectionSpy).toHaveBeenCalledWith(
				'test_collection',
				expect.objectContaining({
					meta: expect.objectContaining({ icon: 'table' }),
				}),
				mutationOptions,
			);
		});

		it('Deletes collection and its relations', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [
					{
						collection: 'test_collection',
						meta: {},
						schema: { name: 'test_collection' },
					} as SnapshotCollection,
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [
					{
						collection: 'test_collection',
						diff: [
							{
								kind: DiffKind.DELETE,
								lhs: {
									collection: 'test_collection',
									meta: {},
									schema: { name: 'test_collection' },
								} as Collection,
							},
						],
					},
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const deleteOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'deleteOne').mockResolvedValue('test');

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(deleteOneCollectionSpy).toHaveBeenCalledTimes(1);
			expect(deleteOneCollectionSpy).toHaveBeenCalledWith('test_collection', mutationOptions);
		});
	});

	describe('Fields', () => {
		it('Creates new field', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [
					{
						collection: 'test_collection',
						meta: {},
						schema: { name: 'test_collection' },
					} as SnapshotCollection,
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [
					{
						collection: 'test_collection',
						field: 'new_field',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									field: 'new_field',
									type: 'string',
									meta: {},
									schema: {},
								} as SnapshotField,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const createFieldSpy = vi.spyOn(FieldsService.prototype, 'createField').mockResolvedValue();

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(createFieldSpy).toHaveBeenCalledTimes(1);

			expect(createFieldSpy).toHaveBeenCalledWith(
				'test_collection',
				expect.objectContaining({
					field: 'new_field',
					type: 'string',
				}),
				undefined,
				mutationOptions,
			);
		});

		it('Updates existing field', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [
					{
						collection: 'test_collection',
						field: 'test_field',
						name: 'test_field',
						type: 'string',
						meta: { note: 'old note' },
						schema: {},
					} as SnapshotField,
				],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [
					{
						collection: 'test_collection',
						field: 'test_field',
						diff: [
							{
								kind: DiffKind.EDIT,
								path: ['meta', 'note'],
								lhs: 'old note' as any,
								rhs: 'new note' as any,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const updateFieldSpy = vi.spyOn(FieldsService.prototype, 'updateField').mockResolvedValue('test' as any);

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(updateFieldSpy).toHaveBeenCalledTimes(1);

			expect(updateFieldSpy).toHaveBeenCalledWith(
				'test_collection',
				expect.objectContaining({
					field: 'test_field',
					meta: expect.objectContaining({ note: 'new note' }),
				}),
				mutationOptions,
			);
		});

		it('Deletes field', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [
					{
						collection: 'test_collection',
						field: 'test_field',
						name: 'test_field',
						type: 'string',
						meta: {},
						schema: {},
					} as SnapshotField,
				],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [
					{
						collection: 'test_collection',
						field: 'test_field',
						diff: [
							{
								kind: DiffKind.DELETE,
								lhs: {
									collection: 'test_collection',
									field: 'test_field',
									type: 'string',
									meta: {},
									schema: {},
								} as SnapshotField,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const deleteFieldSpy = vi.spyOn(FieldsService.prototype, 'deleteField').mockResolvedValue();

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(deleteFieldSpy).toHaveBeenCalledTimes(1);
			expect(deleteFieldSpy).toHaveBeenCalledWith('test_collection', 'test_field', mutationOptions);
		});

		it('Handles nested meta updates', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [
					{
						collection: 'test_collection',
						field: 'test_field',
						name: 'test_field',
						type: 'string',
						meta: { options: { option_a: 'value_a' } },
						schema: {},
					} as unknown as SnapshotField,
				],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [
					{
						collection: 'test_collection',
						field: 'test_field',
						diff: [
							{
								kind: DiffKind.NEW,
								path: ['meta', 'options', 'option_b'],
								rhs: 'value_b' as any,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const updateFieldSpy = vi.spyOn(FieldsService.prototype, 'updateField').mockResolvedValue('test' as any);

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(updateFieldSpy).toHaveBeenCalledTimes(1);

			expect(updateFieldSpy).toHaveBeenCalledWith(
				'test_collection',
				expect.objectContaining({
					field: 'test_field',
					meta: expect.objectContaining({
						options: expect.objectContaining({
							option_a: 'value_a',
							option_b: 'value_b',
						}),
					}),
				}),
				mutationOptions,
			);
		});
	});

	describe('System Fields', () => {
		it('Updates system field is_indexed property', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [
					{
						collection: 'directus_users',
						field: 'id',
						meta: {},
						schema: { is_indexed: false },
					} as unknown as SnapshotSystemField,
				],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [],
				systemFields: [
					{
						collection: 'directus_users',
						field: 'id',
						diff: [
							{
								kind: DiffKind.EDIT,
								path: ['schema', 'is_indexed'],
								lhs: false as any,
								rhs: true as any,
							},
						],
					},
				],
				relations: [],
			};

			const updateFieldSpy = vi.spyOn(FieldsService.prototype, 'updateField').mockResolvedValue('test' as any);

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(updateFieldSpy).toHaveBeenCalledTimes(1);

			expect(updateFieldSpy).toHaveBeenCalledWith(
				'directus_users',
				expect.objectContaining({
					schema: expect.objectContaining({ is_indexed: true }),
				}),
				mutationOptions,
			);
		});
	});

	describe('Relations', () => {
		it('Creates new relation', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [],
				systemFields: [],
				relations: [
					{
						collection: 'articles',
						field: 'author_id',
						related_collection: 'authors',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'articles',
									field: 'author_id',
									related_collection: 'authors',
									meta: {},
									schema: {},
								} as SnapshotRelation,
							},
						],
					},
				],
			};

			const createOneRelationSpy = vi.spyOn(RelationsService.prototype, 'createOne').mockResolvedValue(undefined);

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(createOneRelationSpy).toHaveBeenCalledTimes(1);

			expect(createOneRelationSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					collection: 'articles',
					field: 'author_id',
					related_collection: 'authors',
				}),
				mutationOptions,
			);
		});

		it('Updates existing relation', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [
					{
						collection: 'articles',
						field: 'author_id',
						related_collection: 'authors',
						meta: {},
						schema: { on_delete: 'SET NULL' },
					} as unknown as SnapshotRelation,
				],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [],
				systemFields: [],
				relations: [
					{
						collection: 'articles',
						field: 'author_id',
						related_collection: 'authors',
						diff: [
							{
								kind: DiffKind.EDIT,
								path: ['schema', 'on_delete'],
								lhs: 'SET NULL' as any,
								rhs: 'CASCADE' as any,
							},
						],
					},
				],
			};

			const updateOneRelationSpy = vi.spyOn(RelationsService.prototype, 'updateOne').mockResolvedValue(undefined);

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(updateOneRelationSpy).toHaveBeenCalledTimes(1);

			expect(updateOneRelationSpy).toHaveBeenCalledWith(
				'articles',
				'author_id',
				expect.objectContaining({
					schema: expect.objectContaining({ on_delete: 'CASCADE' }),
				}),
				mutationOptions,
			);
		});

		it('Deletes relation', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [
					{
						collection: 'articles',
						field: 'author_id',
						related_collection: 'authors',
						meta: {},
						schema: {},
					} as unknown as SnapshotRelation,
				],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [],
				systemFields: [],
				relations: [
					{
						collection: 'articles',
						field: 'author_id',
						related_collection: 'authors',
						diff: [
							{
								kind: DiffKind.DELETE,
								lhs: {
									collection: 'articles',
									field: 'author_id',
									related_collection: 'authors',
									meta: {},
									schema: {},
								} as SnapshotRelation,
							},
						],
					},
				],
			};

			const deleteOneRelationSpy = vi.spyOn(RelationsService.prototype, 'deleteOne').mockResolvedValue(undefined);

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(deleteOneRelationSpy).toHaveBeenCalledTimes(1);
			expect(deleteOneRelationSpy).toHaveBeenCalledWith('articles', 'author_id', mutationOptions);
		});
	});

	describe('Concurrent index creation', () => {
		it('Passes attemptConcurrentIndex and deferredIndexes in mutationOptions when enabled', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [
					{
						collection: 'test_collection',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									meta: { group: null },
									schema: { name: 'test_collection' },
								} as Collection,
							},
						],
					},
				],
				fields: [
					{
						collection: 'test_collection',
						field: 'id',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									field: 'id',
									type: 'integer',
									meta: {},
									schema: { is_primary_key: true },
								} as SnapshotField,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');

			await applyDiff(currentSnapshot, snapshotDiff, {
				database: db,
				schema: snapshotApplyTestSchema,
				attemptConcurrentIndex: true,
			});

			expect(createOneCollectionSpy).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					autoPurgeSystemCache: false,
					bypassLimits: true,
					attemptConcurrentIndex: true,
					deferredIndexes: expect.any(Array),
				}),
			);
		});

		it('Calls addColumnIndex after transaction for deferred indexes', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [
					{
						collection: 'test_collection',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									meta: { group: null },
									schema: { name: 'test_collection' },
								} as Collection,
							},
						],
					},
				],
				fields: [
					{
						collection: 'test_collection',
						field: 'id',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									field: 'id',
									type: 'integer',
									meta: {},
									schema: { is_primary_key: true },
								} as SnapshotField,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const mockField = { field: 'test_field', type: 'string' };

			vi.spyOn(CollectionsService.prototype, 'createOne').mockImplementation(async (_data, opts: any) => {
				opts.deferredIndexes.push({
					collection: 'test_collection',
					field: mockField,
				});

				return 'test';
			});

			const addColumnIndexSpy = vi.spyOn(FieldsService.prototype, 'addColumnIndex').mockResolvedValue(undefined as any);

			await applyDiff(currentSnapshot, snapshotDiff, {
				database: db,
				schema: snapshotApplyTestSchema,
				attemptConcurrentIndex: true,
			});

			expect(addColumnIndexSpy).toHaveBeenCalledTimes(1);

			expect(addColumnIndexSpy).toHaveBeenCalledWith('test_collection', mockField, {
				attemptConcurrentIndex: true,
			});
		});

		it('Does not include concurrent options when attemptConcurrentIndex is not set', async () => {
			const currentSnapshot: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const snapshotDiff: SnapshotDiff = {
				collections: [
					{
						collection: 'test_collection',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									meta: { group: null },
									schema: { name: 'test_collection' },
								} as Collection,
							},
						],
					},
				],
				fields: [
					{
						collection: 'test_collection',
						field: 'id',
						diff: [
							{
								kind: DiffKind.NEW,
								rhs: {
									collection: 'test_collection',
									field: 'id',
									type: 'integer',
									meta: {},
									schema: { is_primary_key: true },
								} as SnapshotField,
							},
						],
					},
				],
				systemFields: [],
				relations: [],
			};

			const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');

			await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

			expect(createOneCollectionSpy).toHaveBeenCalledWith(
				expect.anything(),
				expect.not.objectContaining({
					attemptConcurrentIndex: expect.anything(),
				}),
			);
		});
	});

	describe('UUID field casting', () => {
		it.each(['char', 'varchar'])(
			'casts UUID fields from %s(36) to uuid type when creating collection',
			async (dataType) => {
				const currentSnapshot: Snapshot = {
					version: 1,
					directus: '0.0.0',
					collections: [],
					fields: [],
					systemFields: [],
					relations: [],
				};

				const snapshotDiff: SnapshotDiff = {
					collections: [
						{
							collection: 'test_collection',
							diff: [
								{
									kind: DiffKind.NEW,
									rhs: {
										collection: 'test_collection',
										meta: { group: null },
										schema: { name: 'test_collection' },
									} as Collection,
								},
							],
						},
					],
					fields: [
						{
							collection: 'test_collection',
							field: 'id',
							diff: [
								{
									kind: DiffKind.NEW,
									rhs: {
										collection: 'test_collection',
										field: 'id',
										type: 'uuid',
										meta: {},
										schema: {
											data_type: dataType,
											max_length: 36,
											is_primary_key: true,
										},
									} as SnapshotField,
								},
							],
						},
					],
					systemFields: [],
					relations: [],
				};

				const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');

				await applyDiff(currentSnapshot, snapshotDiff, { database: db, schema: snapshotApplyTestSchema });

				expect(createOneCollectionSpy).toHaveBeenCalledTimes(1);

				expect(createOneCollectionSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						fields: expect.arrayContaining([
							expect.objectContaining({
								field: 'id',
								type: 'uuid',
								schema: expect.objectContaining({
									data_type: 'uuid',
									max_length: null,
								}),
							}),
						]),
					}),
					mutationOptions,
				);
			},
		);
	});
});
