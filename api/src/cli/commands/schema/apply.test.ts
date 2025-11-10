import { DiffKind } from '@directus/types';
import type { Snapshot, SnapshotDiff, SnapshotField, SnapshotRelation, SnapshotSystemField } from '@directus/types';
import type { ApiCollection } from '@directus/types';
import type { Diff } from 'deep-diff';
import { promises as fs } from 'fs';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import path from 'path';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { apply, filterSnapshotDiff, formatPath, formatRelatedCollection } from './apply.js';

vi.mock('inquirer');
vi.mock('../../../database/index.js');
vi.mock('../../../logger/index.js');
vi.mock('../../../utils/apply-snapshot.js');
vi.mock('../../../utils/get-snapshot-diff.js');
vi.mock('../../../utils/get-snapshot.js');

import getDatabase, { isInstalled, validateDatabaseConnection } from '../../../database/index.js';
import { useLogger } from '../../../logger/index.js';
import { applySnapshot } from '../../../utils/apply-snapshot.js';
import { getSnapshotDiff } from '../../../utils/get-snapshot-diff.js';
import { getSnapshot } from '../../../utils/get-snapshot.js';

class Client_PG extends MockClient {}

describe('apply command', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeEach(() => {
		db = vi.mocked(knex.default({ client: Client_PG }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('filterSnapshotDiff', () => {
		test('should filter out collections by name', () => {
			const snapshotDiff: SnapshotDiff = {
				collections: [
					{ collection: 'users', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
					{ collection: 'posts', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			const result = filterSnapshotDiff(snapshotDiff, ['users']);

			expect(result.collections).toHaveLength(1);
			expect(result.collections[0]!.collection).toBe('posts');
		});

		test('should filter out fields by collection.field name', () => {
			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [
					{
						collection: 'posts',
						field: 'title',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
					{
						collection: 'posts',
						field: 'content',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
				],
				systemFields: [],
				relations: [],
			};

			const result = filterSnapshotDiff(snapshotDiff, ['posts.title']);

			expect(result.fields).toHaveLength(1);
			expect(result.fields[0]!.field).toBe('content');
		});

		test('should filter out all fields in a collection when collection is filtered', () => {
			const snapshotDiff: SnapshotDiff = {
				collections: [
					{ collection: 'posts', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
				],
				fields: [
					{
						collection: 'posts',
						field: 'title',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
					{
						collection: 'posts',
						field: 'content',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
					{
						collection: 'users',
						field: 'name',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
				],
				systemFields: [],
				relations: [],
			};

			const result = filterSnapshotDiff(snapshotDiff, ['posts']);

			expect(result.collections).toHaveLength(0);
			expect(result.fields).toHaveLength(1);
			expect(result.fields[0]!.collection).toBe('users');
		});

		test('should filter system fields by collection.field', () => {
			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [],
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						diff: [{ kind: DiffKind.EDIT, lhs: {}, rhs: {} } as Diff<SnapshotSystemField | undefined>],
					},
					{
						collection: 'posts',
						field: 'date_updated',
						diff: [{ kind: DiffKind.EDIT, lhs: {}, rhs: {} } as Diff<SnapshotSystemField | undefined>],
					},
				],
				relations: [],
			};

			const result = filterSnapshotDiff(snapshotDiff, ['posts.date_created']);

			expect(result.systemFields).toHaveLength(1);
			expect(result.systemFields[0]!.field).toBe('date_updated');
		});

		test('should filter relations by collection.field', () => {
			const snapshotDiff: SnapshotDiff = {
				collections: [],
				fields: [],
				systemFields: [],
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotRelation | undefined>],
					},
					{
						collection: 'posts',
						field: 'category_id',
						related_collection: 'categories',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotRelation | undefined>],
					},
				],
			};

			const result = filterSnapshotDiff(snapshotDiff, ['posts.author_id']);

			expect(result.relations).toHaveLength(1);
			expect(result.relations[0]!.field).toBe('category_id');
		});

		test('should handle multiple filters', () => {
			const snapshotDiff: SnapshotDiff = {
				collections: [
					{ collection: 'users', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
					{ collection: 'posts', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
				],
				fields: [
					{
						collection: 'posts',
						field: 'title',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
					{
						collection: 'posts',
						field: 'content',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
				],
				systemFields: [],
				relations: [],
			};

			const result = filterSnapshotDiff(snapshotDiff, ['users', 'posts.title']);

			expect(result.collections).toHaveLength(1);
			expect(result.collections[0]!.collection).toBe('posts');
			expect(result.fields).toHaveLength(1);
			expect(result.fields[0]!.field).toBe('content');
		});

		test('should return all items when no filters provided', () => {
			const snapshotDiff: SnapshotDiff = {
				collections: [
					{ collection: 'users', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
				],
				fields: [
					{
						collection: 'posts',
						field: 'title',
						diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<SnapshotField | undefined>],
					},
				],
				systemFields: [],
				relations: [],
			};

			const result = filterSnapshotDiff(snapshotDiff, []);

			expect(result.collections).toHaveLength(1);
			expect(result.fields).toHaveLength(1);
		});
	});

	describe('formatPath helper', () => {
		test('should return single element as string', () => {
			const result = formatPath(['field']);
			expect(result).toBe('field');
		});

		test('should join multiple elements with dots, skipping first', () => {
			const result = formatPath(['ignored', 'meta', 'hidden']);
			expect(result).toBe('meta.hidden');
		});

		test('should handle two-element array', () => {
			const result = formatPath(['ignored', 'name']);
			expect(result).toBe('name');
		});

		test('should handle deep nested paths', () => {
			const result = formatPath(['ignored', 'meta', 'options', 'nested', 'value']);
			expect(result).toBe('meta.options.nested.value');
		});
	});

	describe('formatRelatedCollection helper', () => {
		test('should format related collection with arrow', () => {
			const result = formatRelatedCollection('users');
			expect(result).toBe(' → users');
		});

		test('should return empty string for null', () => {
			const result = formatRelatedCollection(null);
			expect(result).toBe('');
		});

		test('should handle empty string', () => {
			// Though unlikely in practice, empty string is falsy
			const result = formatRelatedCollection('');
			expect(result).toBe('');
		});
	});

	describe('apply function', () => {
		let mockLogger: any;
		let mockDatabase: any;

		beforeEach(() => {
			// Setup mocks
			mockLogger = {
				info: vi.fn(),
				error: vi.fn(),
			};

			mockDatabase = {
				destroy: vi.fn(),
			};

			// Setup default mock implementations
			vi.mocked(getDatabase).mockReturnValue(mockDatabase as Knex);
			vi.mocked(useLogger).mockReturnValue(mockLogger);
			vi.mocked(validateDatabaseConnection).mockResolvedValue(undefined);
			vi.mocked(isInstalled).mockResolvedValue(true);

			// Mock process.exit
			vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
			vi.spyOn(process, 'cwd').mockReturnValue('/test/dir');

			// Mock fs.readFile
			vi.spyOn(fs, 'readFile').mockResolvedValue('{}');
		});

		test('should validate database connection', async () => {
			vi.mocked(validateDatabaseConnection).mockRejectedValue(new Error('Connection failed'));

			await expect(apply('snapshot.json')).rejects.toThrow('Connection failed');
			expect(vi.mocked(validateDatabaseConnection)).toHaveBeenCalledWith(mockDatabase);
		});

		test('should error if Directus is not installed', async () => {
			vi.mocked(isInstalled).mockResolvedValue(false);

			try {
				await apply('snapshot.json');
			} catch {
				// Expected to throw
			}

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining("Directus isn't installed on this database"),
			);

			expect(mockDatabase.destroy).toHaveBeenCalled();
			expect(process.exit).toHaveBeenCalledWith(0);
		});

		test('should read JSON snapshot file', async () => {
			const mockSnapshot: Snapshot = {
				version: 1,
				directus: '10.0.0',
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			};

			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSnapshot));

			vi.mocked(getSnapshot).mockResolvedValue(mockSnapshot);

			vi.mocked(getSnapshotDiff).mockReturnValue({
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			});

			await apply('snapshot.json');

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/test/dir', 'snapshot.json'), 'utf8');
		});

		test('should read YAML snapshot file', async () => {
			const mockSnapshot: Snapshot = {
				version: 1,
				directus: '10.0.0',
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			};

			const yamlContent = `
version: 1
directus: '10.0.0'
collections: []
fields: []
relations: []
`;

			vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
			vi.mocked(getSnapshot).mockResolvedValue(mockSnapshot);

			vi.mocked(getSnapshotDiff).mockReturnValue({
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			});

			await apply('snapshot.yaml');

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/test/dir', 'snapshot.yaml'), 'utf8');
		});

		test('should exit if no changes to apply', async () => {
			const mockSnapshot: Snapshot = {
				version: 1,
				directus: '10.0.0',
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			};

			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSnapshot));
			vi.mocked(getSnapshot).mockResolvedValue(mockSnapshot);

			vi.mocked(getSnapshotDiff).mockReturnValue({
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			});

			await apply('snapshot.json');

			expect(mockLogger.info).toHaveBeenCalledWith('No changes to apply.');
			expect(mockDatabase.destroy).toHaveBeenCalled();
			expect(process.exit).toHaveBeenCalledWith(0);
		});

		test('should apply snapshot with --yes flag without prompting', async () => {
			const mockSnapshot: Snapshot = {
				version: 1,
				directus: '10.0.0',
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			};

			const mockDiff: SnapshotDiff = {
				collections: [
					{ collection: 'posts', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSnapshot));
			vi.mocked(getSnapshot).mockResolvedValue(mockSnapshot);
			vi.mocked(getSnapshotDiff).mockReturnValue(mockDiff);

			await apply('snapshot.json', { yes: true, dryRun: false, ignoreRules: '' });

			// Don't check inquirer.prompt as it's not easy to mock module-level exports
			expect(applySnapshot).toHaveBeenCalledWith(mockSnapshot, {
				current: mockSnapshot,
				diff: mockDiff,
				database: mockDatabase,
			});

			expect(mockLogger.info).toHaveBeenCalledWith('Snapshot applied successfully');
			expect(process.exit).toHaveBeenCalledWith(0);
		});

		test('should display changes and exit in dry-run mode', async () => {
			const mockSnapshot: Snapshot = {
				version: 1,
				directus: '10.0.0',
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			};

			const mockDiff: SnapshotDiff = {
				collections: [
					{ collection: 'posts', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSnapshot));
			vi.mocked(getSnapshot).mockResolvedValue(mockSnapshot);
			vi.mocked(getSnapshotDiff).mockReturnValue(mockDiff);

			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			await apply('snapshot.json', { yes: false, dryRun: true, ignoreRules: '' });

			expect(consoleSpy).toHaveBeenCalled();
			expect(applySnapshot).not.toHaveBeenCalled();
			expect(process.exit).toHaveBeenCalledWith(0);

			consoleSpy.mockRestore();
		});

		test('should filter snapshot diff when ignoreRules provided', async () => {
			const mockSnapshot: Snapshot = {
				version: 1,
				directus: '10.0.0',
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			};

			const mockDiff: SnapshotDiff = {
				collections: [
					{ collection: 'users', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
					{ collection: 'posts', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSnapshot));
			vi.mocked(getSnapshot).mockResolvedValue(mockSnapshot);
			vi.mocked(getSnapshotDiff).mockReturnValue(mockDiff);

			await apply('snapshot.json', { yes: true, dryRun: false, ignoreRules: 'users' });

			// applySnapshot should be called with filtered diff
			expect(applySnapshot).toHaveBeenCalledWith(
				mockSnapshot,
				expect.objectContaining({
					diff: expect.objectContaining({
						collections: expect.arrayContaining([expect.objectContaining({ collection: 'posts' })]),
					}),
				}),
			);
		});

		test('should handle errors and log them', async () => {
			const error = new Error('File not found');
			vi.mocked(fs.readFile).mockRejectedValue(error);

			try {
				await apply('nonexistent.json');
			} catch {
				// Expected to throw
			}

			expect(mockLogger.error).toHaveBeenCalledWith(error);
			expect(mockDatabase.destroy).toHaveBeenCalled();
			expect(process.exit).toHaveBeenCalledWith(1);
		});

		test('should display collection changes with proper formatting', async () => {
			const mockSnapshot: Snapshot = {
				version: 1,
				directus: '10.0.0',
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			};

			const mockDiff: SnapshotDiff = {
				collections: [
					{ collection: 'posts', diff: [{ kind: DiffKind.NEW, rhs: {} } as Diff<ApiCollection | undefined>] },
					{ collection: 'users', diff: [{ kind: DiffKind.DELETE, lhs: {} } as Diff<ApiCollection | undefined>] },
					{
						collection: 'comments',
						diff: [
							{
								kind: DiffKind.EDIT,
								path: ['meta', 'hidden'],
								lhs: false,
								rhs: true,
							} as unknown as Diff<ApiCollection | undefined>,
						],
					},
				],
				fields: [],
				systemFields: [],
				relations: [],
			};

			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSnapshot));
			vi.mocked(getSnapshot).mockResolvedValue(mockSnapshot);
			vi.mocked(getSnapshotDiff).mockReturnValue(mockDiff);

			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			await apply('snapshot.json', { yes: false, dryRun: true, ignoreRules: '' });

			const output = consoleSpy.mock.calls.join('\n');
			expect(output).toContain('Collections:');
			expect(output).toContain('posts');
			expect(output).toContain('users');
			expect(output).toContain('comments');

			consoleSpy.mockRestore();
		});
	});
});
