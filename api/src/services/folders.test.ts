import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createMockKnex } from '../test-utils/knex.js';
import { FoldersService } from './folders.js';
import { ItemsService } from './items.js';

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

describe('FoldersService', () => {
	const mockSchema = {
		collections: {},
		relations: [],
	} as SchemaOverview;

	let foldersService = new FoldersService({
		schema: mockSchema,
	});

	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('buildTree', () => {
		describe('hierarchy', () => {
			test('should build tree for single root folder', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(1);
				expect(tree.get('root-id')).toBe('parent');

				expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
					{ filter: { type: { _eq: 'files' } }, fields: ['id', 'parent', 'name'], limit: -1 },
					undefined,
				);
			});

			test('should build tree for simple hierarchy', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
					{ id: 'child-id', name: 'child', parent: 'root-id' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(2);
				expect(tree.get('root-id')).toBe('parent');
				expect(tree.get('child-id')).toBe('parent/child');
			});

			test('should build tree with multiple levels of nesting', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
					{ id: 'child-id', name: 'child', parent: 'root-id' },
					{ id: 'child-id-1', name: 'child-1', parent: 'child-id' },
					{ id: 'child-id-2', name: 'child-2', parent: 'child-id-1' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(4);
				expect(tree.get('root-id')).toBe('parent');
				expect(tree.get('child-id')).toBe('parent/child');
				expect(tree.get('child-id-1')).toBe('parent/child/child-1');
				expect(tree.get('child-id-2')).toBe('parent/child/child-1/child-2');
			});

			test('should build tree with multiple children at same level', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
					{ id: 'child-id', name: 'child', parent: 'root-id' },
					{ id: 'child-id-1', name: 'child-1', parent: 'root-id' },
					{ id: 'child-id-2', name: 'child-2', parent: 'root-id' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(4);
				expect(tree.get('root-id')).toBe('parent');
				expect(tree.get('child-id')).toBe('parent/child');
				expect(tree.get('child-id-1')).toBe('parent/child-1');
				expect(tree.get('child-id-2')).toBe('parent/child-2');
			});
		});

		describe('deduplication', () => {
			test('should deduplicate folder names within same parent', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
					{ id: 'child-id', name: 'child', parent: 'root-id' },
					{ id: 'child-id-1', name: 'child', parent: 'root-id' },
					{ id: 'child-id-2', name: 'child', parent: 'root-id' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(4);
				expect(tree.get('child-id')).toBe('parent/child (2)');
				expect(tree.get('child-id-1')).toBe('parent/child (1)');
				expect(tree.get('child-id-2')).toBe('parent/child');
			});

			test('should allow duplicate folder names in different parent', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
					{ id: 'child-id', name: 'child', parent: 'root-id' },
					{ id: 'child-id-1', name: 'child', parent: 'root-id' },
					{ id: 'child-id-2', name: 'child', parent: 'child-id' },
					{ id: 'child-id-3', name: 'child', parent: 'child-id-1' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(5);
				expect(tree.get('child-id')).toBe('parent/child (1)');
				expect(tree.get('child-id-1')).toBe('parent/child');
				expect(tree.get('child-id-2')).toBe('parent/child (1)/child');
				expect(tree.get('child-id-3')).toBe('parent/child/child');
			});
		});

		describe('permissions', () => {
			test('throws error when user lacks access to root', async () => {
				const accountability = { admin: false, user: 'user-123' } as Accountability;

				foldersService = new FoldersService({
					schema: mockSchema,
					accountability,
				});

				vi.mocked(validateAccess).mockRejectedValue(new ForbiddenError());

				await expect(foldersService.buildTree('root-1')).rejects.toThrow(ForbiddenError);

				expect(vi.mocked(validateAccess)).toHaveBeenCalledWith(
					{
						collection: 'directus_folders',
						accountability,
						action: 'read',
						primaryKeys: ['root-1'],
					},
					expect.any(Object),
				);
			});

			test('should skip folders if "id" is restricted', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'Root', parent: null },
					{ id: null, name: 'Invalid', parent: 'root-id' },
					{ id: 'child-id', name: 'Valid', parent: 'root-id' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(2);
				expect(tree.has('root-id')).toBe(true);
				expect(tree.has('child-id')).toBe(true);
			});

			test('should fallback to folder id if "name" is restricted', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
					{ id: 'child-id', name: null, parent: 'root-id' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.get('root-id')).toBe('parent');
				expect(tree.get('child-id')).toBe('parent/child-id');
			});

			test('skips validation for admin users', async () => {
				const accountability = { admin: true, user: 'user-123' } as Accountability;

				foldersService = new FoldersService({
					schema: mockSchema,
					accountability,
				});

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
				]);

				await foldersService.buildTree('root-1');

				expect(vi.mocked(validateAccess)).not.toHaveBeenCalled();
			});

			test('skips validation for admin users (null)', async () => {
				foldersService = new FoldersService({
					schema: mockSchema,
				});

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
				]);

				await foldersService.buildTree('root-1');

				expect(vi.mocked(validateAccess)).not.toHaveBeenCalled();
			});
		});

		describe('edge cases', () => {
			test('should exclude root from child lookup to avoid circular reference', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'root', parent: 'parent' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(1);
				expect(tree.get('root-id')).toBe('root');
			});

			test('should exclude folders outside the hierarchy', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
					{ id: 'child-id', name: 'child', parent: 'root-id' },
					{ id: 'root-id-1', name: 'parent-1', parent: null },
					{ id: 'child-id-1', name: 'child-1', parent: 'root-id-1' },
				]);

				const tree = await foldersService.buildTree('root-id');

				expect(tree.size).toBe(2);
				expect(tree.has('root-id')).toBe(true);
				expect(tree.has('child-id')).toBe(true);
				expect(tree.has('root-id-1')).toBe(false);
				expect(tree.has('child-id-1')).toBe(false);
			});
		});
	});

	describe('flows folder restrictions', () => {
		const nonAdmin = { admin: false, user: 'user-123' } as Accountability;
		const admin = { admin: true, user: 'user-123' } as Accountability;

		const { db, tracker } = createMockKnex();

		beforeEach(() => {
			tracker.reset();
		});

		test('blocks a non-admin creating a folder under a flows folder', async () => {
			tracker.on
				.select('directus_folders')
				.response((query) => (query.bindings.includes('flows-folder') ? [{ id: 'flows-folder' }] : []));

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.createOne({ name: 'Images', parent: 'flows-folder' });

			expect(tracker.history.select[0]!.bindings).toEqual(['flows-folder', 'flows', 1]);
			expect(tracker.history.select[0]!.postOp).toBe('first');

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				{ name: 'Images', parent: 'flows-folder' },
				expect.objectContaining({
					preMutationError: expect.objectContaining({
						message: 'Invalid payload. Cannot nest a folder under a flows folder.',
					}),
				}),
			);
		});

		test('blocks a non-admin moving a folder under a flows folder', async () => {
			tracker.on
				.select('directus_folders')
				.response((query) => (query.bindings.includes('flows-folder') ? [{ id: 'flows-folder' }] : []));

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.updateMany(['folder-1'], { parent: 'flows-folder' });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['folder-1'],
				{ parent: 'flows-folder' },
				expect.objectContaining({ preMutationError: expect.any(InvalidPayloadError) }),
			);
		});

		test('lets a non-admin nest a folder under a file library folder', async () => {
			tracker.on.select('directus_folders').response([]);

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.updateMany(['folder-1'], { parent: 'files-folder' });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['folder-1'],
				{ parent: 'files-folder' },
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('lets an admin nest a folder under a flows folder', async () => {
			tracker.on.select('directus_folders').response([{ id: 'flows-folder' }]);

			const service = new FoldersService({ schema: mockSchema, accountability: admin, knex: db });

			await service.updateMany(['folder-1'], { parent: 'flows-folder' });

			expect(tracker.history.select).toHaveLength(0);

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['folder-1'],
				{ parent: 'flows-folder' },
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('skips the parent lookup when moving a folder back to root', async () => {
			tracker.on.select('directus_folders').response([]);

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.updateMany(['folder-1'], { parent: null });

			expect(tracker.history.select).toHaveLength(1);
			expect(tracker.history.select[0]!.bindings).toEqual(['folder-1', 'flows', 1]);

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['folder-1'],
				{ parent: null },
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('blocks a non-admin creating a flows folder', async () => {
			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.createOne({ name: 'Flows', type: 'flows' });

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				{ name: 'Flows', type: 'flows' },
				expect.objectContaining({
					preMutationError: expect.objectContaining({
						message: 'Invalid payload. Cannot create a flows folder.',
					}),
				}),
			);
		});

		test('lets a non-admin create a file library folder', async () => {
			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.createOne({ name: 'Images' });

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				{ name: 'Images' },
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('lets an admin create a flows folder', async () => {
			const service = new FoldersService({ schema: mockSchema, accountability: admin, knex: db });

			await service.createOne({ name: 'Flows', type: 'flows' });

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				{ name: 'Flows', type: 'flows' },
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('lets an internal call create a flows folder', async () => {
			const service = new FoldersService({ schema: mockSchema, accountability: null, knex: db });

			await service.createOne({ name: 'Flows', type: 'flows' });

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				{ name: 'Flows', type: 'flows' },
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('blocks a non-admin retyping a folder to flows', async () => {
			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.updateMany(['folder-1'], { type: 'flows' });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['folder-1'],
				{ type: 'flows' },
				expect.objectContaining({
					preMutationError: expect.objectContaining({
						message: 'Invalid payload. Cannot change a folder into a flows folder.',
					}),
				}),
			);
		});

		test('blocks a non-admin updating an existing flows folder without naming it', async () => {
			tracker.on.select('directus_folders').response([{ id: 'folder-2' }]);

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.updateMany(['folder-1', 'folder-2'], { name: 'Renamed' });

			expect(tracker.history.select[0]!.bindings).toEqual(['folder-1', 'folder-2', 'flows', 1]);

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['folder-1', 'folder-2'],
				{ name: 'Renamed' },
				expect.objectContaining({
					preMutationError: expect.objectContaining({
						message: 'Invalid payload. Cannot update a flows folder.',
					}),
				}),
			);
		});

		test('lets a non-admin update a file library folder', async () => {
			tracker.on.select('directus_folders').response([]);

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.updateMany(['folder-1'], { name: 'Renamed' });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['folder-1'],
				{ name: 'Renamed' },
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('blocks a non-admin deleting an existing flows folder', async () => {
			tracker.on.select('directus_folders').response([{ id: 'folder-1' }]);

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.deleteMany(['folder-1']);

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(
				['folder-1'],
				expect.objectContaining({
					preMutationError: expect.objectContaining({
						message: 'Invalid payload. Cannot delete a flows folder.',
					}),
				}),
			);
		});

		test('lets a non-admin delete a file library folder', async () => {
			tracker.on.select('directus_folders').response([]);

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.deleteMany(['folder-1']);

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(
				['folder-1'],
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('skips the lookup when there are no keys', async () => {
			tracker.on.select('directus_folders').response([{ id: 'folder-1' }]);

			const service = new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db });

			await service.deleteMany([]);

			expect(tracker.history.select).toHaveLength(0);

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(
				[],
				expect.not.objectContaining({ preMutationError: expect.anything() }),
			);
		});

		test('hides flows folders from non-admin reads', async () => {
			await new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db }).readByQuery({
				filter: { name: { _eq: 'Images' } },
			});

			expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
				{ filter: { _and: [{ name: { _eq: 'Images' } }, { type: { _neq: 'flows' } }] } },
				undefined,
			);
		});

		test('scopes a non-admin read without a filter', async () => {
			await new FoldersService({ schema: mockSchema, accountability: nonAdmin, knex: db }).readByQuery({});

			expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
				{ filter: { type: { _neq: 'flows' } } },
				undefined,
			);
		});

		test('leaves admin reads untouched', async () => {
			await new FoldersService({ schema: mockSchema, accountability: admin, knex: db }).readByQuery({
				filter: { name: { _eq: 'Images' } },
			});

			expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
				{ filter: { name: { _eq: 'Images' } } },
				undefined,
			);
		});

		test('leaves internal reads untouched', async () => {
			await new FoldersService({ schema: mockSchema, accountability: null, knex: db }).readByQuery({
				filter: { name: { _eq: 'Images' } },
			});

			expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
				{ filter: { name: { _eq: 'Images' } } },
				undefined,
			);
		});
	});
});
