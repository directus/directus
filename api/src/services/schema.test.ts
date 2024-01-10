import type { Diff } from 'deep-diff';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '@directus/errors';
import type { Collection } from '../types/collection.js';
import type { Snapshot, SnapshotDiffWithHash } from '../types/snapshot.js';
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
					translations: {},
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
		it('should throw ForbiddenError for non-admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } });

			expect(service.snapshot()).rejects.toThrowError(ForbiddenError);
		});

		it('should return snapshot for admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.snapshot()).resolves.toEqual(testSnapshot);
		});
	});

	describe('apply', () => {
		const snapshotDiffWithHash = {
			hash: '813b3cdf7013310fafde7813b7d5e6bd4eb1e73f',
			diff: {
				collections: [testCollectionDiff],
				fields: [],
				relations: [],
			},
		} satisfies SnapshotDiffWithHash;

		it('should throw ForbiddenError for non-admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } });

			expect(service.apply(snapshotDiffWithHash)).rejects.toThrowError(ForbiddenError);
			expect(vi.mocked(applyDiff)).not.toHaveBeenCalledOnce();
		});

		it('should apply for admin user', async () => {
			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

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
						translations: {},
					},
					schema: {
						name: 'test',
					},
				},
			],
			fields: [],
			relations: [],
		} satisfies Snapshot;

		it('should throw ForbiddenError for non-admin user', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } });

			expect(service.diff(snapshotToApply, { currentSnapshot: testSnapshot, force: true })).rejects.toThrowError(
				ForbiddenError,
			);
		});

		it('should return diff for admin user', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.diff(snapshotToApply, { currentSnapshot: testSnapshot, force: true })).resolves.toEqual({
				collections: [testCollectionDiff],
				fields: [],
				relations: [],
			});
		});

		it('should return null for empty diff', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.diff(testSnapshot, { currentSnapshot: testSnapshot, force: true })).resolves.toBeNull();
		});
	});

	describe('getHashedSnapshot', () => {
		it('should return snapshot for admin user', async () => {
			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.getHashedSnapshot(testSnapshot)).toEqual(
				expect.objectContaining({
					...testSnapshot,
					hash: expect.any(String),
				}),
			);
		});
	});
});
