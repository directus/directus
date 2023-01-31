import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SchemaService } from '.';
import { ForbiddenException } from '..';
import { Snapshot, SnapshotDiffWithHash } from '../types/snapshot';
import { applyDiff } from '../utils/apply-diff';
import { getSnapshot } from '../utils/get-snapshot';

vi.mock('../../package.json', () => ({ version: '0.0.0' }));

vi.mock('../../src/database/index', () => {
	return { __esModule: true, default: vi.fn(), getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

vi.mock('../utils/get-snapshot', () => ({
	getSnapshot: vi.fn(),
}));

vi.mock('../utils/apply-diff', () => ({
	applyDiff: vi.fn(),
}));

class Client_PG extends MockClient {}

let db: Knex;
let tracker: Tracker;

beforeAll(() => {
	db = knex({ client: Client_PG });
	tracker = getTracker();
});

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

describe('Services / Schema', () => {
	describe('snapshot', () => {
		it('should throw ForbiddenException for non-admin user', async () => {
			const testSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } });

			expect(service.snapshot()).rejects.toThrowError(ForbiddenException);
		});

		it('should return snapshot for admin user', async () => {
			const testSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.snapshot()).resolves.toEqual(testSnapshot);
		});
	});

	describe('apply', () => {
		it('should throw ForbiddenException for non-admin user', async () => {
			const testSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

			const snapshotDiffWithHash = {
				hash: '',
				diff: {
					collections: [
						{
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
							],
						},
					],
					fields: [],
					relations: [],
				},
			} satisfies SnapshotDiffWithHash;

			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } });

			expect(service.apply(snapshotDiffWithHash)).rejects.toThrowError(ForbiddenException);
			expect(vi.mocked(applyDiff)).not.toHaveBeenCalledOnce();
		});

		it('should apply for admin user', async () => {
			const testSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

			const snapshotDiffWithHash = {
				hash: '813b3cdf7013310fafde7813b7d5e6bd4eb1e73f',
				diff: {
					collections: [
						{
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
							],
						},
					],
					fields: [],
					relations: [],
				},
			} satisfies SnapshotDiffWithHash;

			vi.mocked(getSnapshot).mockResolvedValueOnce(testSnapshot);

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			await service.apply(snapshotDiffWithHash);

			expect(vi.mocked(applyDiff)).toHaveBeenCalledOnce();
		});
	});

	describe('diff', () => {
		it('should throw ForbiddenException for non-admin user', async () => {
			const currentSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

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

			const service = new SchemaService({ knex: db, accountability: { role: 'test', admin: false } });

			expect(service.diff(snapshotToApply, { currentSnapshot, force: true })).rejects.toThrowError(ForbiddenException);
		});

		it('should return diff for admin user', async () => {
			const currentSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

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

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.diff(snapshotToApply, { currentSnapshot, force: true })).resolves.toEqual({
				collections: [
					{
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
						],
					},
				],
				fields: [],
				relations: [],
			});
		});

		it('should return null for empty diff', async () => {
			const currentSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.diff(currentSnapshot, { currentSnapshot, force: true })).resolves.toBeNull();
		});
	});

	describe('getHashedSnapshot', () => {
		it('should return snapshot for admin user', async () => {
			const testSnapshot = {
				directus: '0.0.0',
				version: 1,
				vendor: 'postgres',
				collections: [],
				fields: [],
				relations: [],
			} satisfies Snapshot;

			const service = new SchemaService({ knex: db, accountability: { role: 'admin', admin: true } });

			expect(service.getHashedSnapshot(testSnapshot)).toEqual(
				expect.objectContaining({
					...testSnapshot,
					hash: expect.any(String),
				})
			);
		});
	});
});
