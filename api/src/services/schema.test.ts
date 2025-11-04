import type { Diff } from 'deep-diff';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { ForbiddenError } from '@directus/errors';
import type { Accountability, Snapshot, SnapshotDiffWithHash } from '@directus/types';
import type { Collection } from '../types/collection.js';
import { applyDiff } from '../utils/apply-diff.js';
import { getSnapshot } from '../utils/get-snapshot.js';
import { SchemaService } from './schema.js';

vi.mock('directus/version', () => ({ version: '0.0.0' }));

vi.mock('../../src/database/index.js', () => {
	return { __esModule: true, default: vi.fn(), getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

vi.mock('../utils/get-snapshot.js', () => ({
	getSnapshot: vi.fn(),
}));

vi.mock('../utils/apply-diff.js', () => ({
	applyDiff: vi.fn(),
}));

class Client_PG extends MockClient {}

let db: Knex;
let tracker: Tracker;

const testSnapshot = {
	directus: '0.0.0',
	version: 1,
	vendor: 'postgres',
	collections: [],
	fields: [],
	systemFields: [],
	relations: [],
} satisfies Snapshot;

const testCollectionDiff = {
	collection: 'test',
	diff: [
		{
			kind: 'N',
			rhs: {
				collection: 'test',
				meta: {
					accountability: 'all',
					collection: 'test',
					group: null,
					hidden: false,
					icon: null,
					item_duplication_fields: null,
					note: null,
					singleton: false,
					translations: null,
					system: false,
					versioning: false,
				},
				schema: { name: 'test' },
			},
		},
	] satisfies Diff<Collection>[],
};

beforeAll(() => {
	db = knex.default({ client: Client_PG });
	tracker = createTracker(db);
});

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

describe('Services / Schema', () => {
	describe('snapshot', () => {
		test('should throw ForbiddenError for non-admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } as Accountability });

			await expect(service.snapshot()).rejects.toThrowError(ForbiddenError);
		});

		test('should return snapshot for admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } as Accountability });

			await expect(service.snapshot()).resolves.toEqual(testSnapshot);
		});
	});

	describe('apply', () => {
		const snapshotDiffWithHash = {
			hash: '22da9fb6231a83de9405cdd4c313aa47967c3448',
			diff: {
				collections: [testCollectionDiff],
				fields: [],
				systemFields: [],
				relations: [],
			},
		} satisfies SnapshotDiffWithHash;

		test('should throw ForbiddenError for non-admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } as Accountability });

			await expect(service.apply(snapshotDiffWithHash)).rejects.toThrowError(ForbiddenError);
			expect(vi.mocked(applyDiff)).not.toHaveBeenCalledOnce();
		});

		test('should apply for admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } as Accountability });

			await service.apply(snapshotDiffWithHash);

			expect(vi.mocked(applyDiff)).toHaveBeenCalledOnce();
		});
	});

	describe('diff', () => {
		const snapshotToApply = {
			directus: '0.0.0',
			version: 1,
			vendor: 'postgres',
			collections: [
				{
					collection: 'test',
					meta: {
						accountability: 'all',
						collection: 'test',
						group: null,
						hidden: false,
						icon: null,
						item_duplication_fields: null,
						note: null,
						singleton: false,
						translations: null,
						system: false,
						versioning: false,
					},
					schema: {
						name: 'test',
					},
				},
			],
			fields: [],
			systemFields: [],
			relations: [],
		} satisfies Snapshot;

		test('should throw ForbiddenError for non-admin user', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } as Accountability });

			await expect(service.diff(snapshotToApply, { currentSnapshot: testSnapshot, force: true })).rejects.toThrowError(
				ForbiddenError,
			);
		});

		test('should return diff for admin user', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } as Accountability });

			await expect(service.diff(snapshotToApply, { currentSnapshot: testSnapshot, force: true })).resolves.toEqual({
				collections: [testCollectionDiff],
				fields: [],
				systemFields: [],
				relations: [],
			});
		});

		test('should return null for empty diff', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } as Accountability });

			await expect(service.diff(testSnapshot, { currentSnapshot: testSnapshot, force: true })).resolves.toBeNull();
		});

		test('should return null for missing systeFields', async () => {
			const testSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} as unknown as Snapshot;

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } as Accountability });

			await expect(service.diff(testSnapshot, { currentSnapshot: testSnapshot, force: true })).resolves.toBeNull();
		});
	});

	describe('getHashedSnapshot', () => {
		test('should return snapshot for admin user', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } as Accountability });

			expect(service.getHashedSnapshot(testSnapshot)).toEqual(
				expect.objectContaining({
					...testSnapshot,
					hash: expect.any(String),
				}),
			);
		});
	});
});
