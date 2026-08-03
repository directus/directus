import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { snapshotApplyTestSchema } from '../../__utils__/schemas.js';
import { CollectionsService } from '../../services/collections.js';
import { FieldsService } from '../../services/fields.js';
import { RelationsService } from '../../services/relations.js';
import type { Collection } from '../../types/collection.js';
import * as getSchema from '../get-schema.js';
import { applyDiff, isNestedMetaUpdate } from './apply-diff.js';

vi.mock('../../cache.js', () => ({
	flushCaches: vi.fn(),
	getCache: vi.fn(() => ({
		cache: null,
	})),
}));

vi.mock('../../emitter.js', () => ({
	default: {
		emitAction: vi.fn(),
	},
}));

vi.mock('../../services/collections.js');
vi.mock('../../services/fields.js');
vi.mock('../../services/relations.js');

describe('isNestedMetaUpdate', () => {
	it.each([
		{ kind: 'E', path: ['meta', 'options', 'option_a'], rhs: {} },
		{ kind: 'N', path: ['meta', 'note'], rhs: 'a' },
		{ kind: 'D', path: ['meta', 'note'], lhs: 'a' },
		{ kind: 'D', path: ['meta', 'status'], lhs: 'draft' },
	])('returns true for nested meta update $path', (diff: any) => {
		expect(isNestedMetaUpdate(diff)).toBe(true);
	});

	it.each([
		{ kind: 'N', path: ['schema', 'default_value'], rhs: {} },
		{ kind: 'D', path: ['schema'] },
		{ kind: 'D', path: [] },
		{ kind: 'D' },
	])('returns false for non-meta diff $path', (diff: any) => {
		expect(isNestedMetaUpdate(diff)).toBe(false);
	});
});

describe('applyDiff', () => {
	let db: Knex;
	let tracker: Tracker;

	const mockCollectionsService = {
		createOne: vi.fn(),
		deleteOne: vi.fn(),
		updateOne: vi.fn(),
	};

	const mockFieldsService = {
		createField: vi.fn(),
		deleteField: vi.fn(),
		updateField: vi.fn(),
	};

	const mockRelationsService = {
		createOne: vi.fn(),
		deleteField: vi.fn(),
		updateOne: vi.fn(),
	};

	beforeEach(() => {
		db = knex({ client: MockClient }) as unknown as Knex;
		tracker = createTracker(db);

		(CollectionsService as unknown as MockedFunction<any>).mockImplementation(() => mockCollectionsService);
		(FieldsService as unknown as MockedFunction<any>).mockImplementation(() => mockFieldsService);
		(RelationsService as unknown as MockedFunction<any>).mockImplementation(() => mockRelationsService);

		vi.spyOn(getSchema, 'getSchema').mockResolvedValue(snapshotApplyTestSchema);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	it('updates collection when diff is a nested meta delete instead of dropping collection', async () => {
		const currentSnapshot: any = {
			version: 1,
			directus: '0.0.0',
			collections: [
				{
					collection: 'articles',
					meta: { status: 'draft', note: 'test' },
					schema: { name: 'articles' },
				},
			],
			fields: [],
			relations: [],
		};

		const snapshotDiff: any = {
			collections: [
				{
					collection: 'articles',
					diff: [{ kind: 'D', path: ['meta', 'status'], lhs: 'draft' }],
				},
			],
			fields: [],
			systemFields: [],
			relations: [],
		};

		await applyDiff(currentSnapshot, snapshotDiff, { database: db });

		expect(mockCollectionsService.deleteOne).not.toHaveBeenCalled();
		expect(mockCollectionsService.updateOne).toHaveBeenCalledWith(
			'articles',
			expect.objectContaining({
				collection: 'articles',
				meta: { note: 'test' },
			}),
			expect.anything(),
		);
	});
});
