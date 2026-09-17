import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
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

				expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith({ limit: -1 }, undefined);
			});

			test('should forward a query to the read query when provided', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
				]);

				await foldersService.buildTree('root-id', { filter: { type: { _eq: 'files' } } });

				expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
					{ limit: -1, filter: { type: { _eq: 'files' } } },
					undefined,
				);
			});

			test('should ignore a limit in the given query', async () => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
				]);

				await foldersService.buildTree('root-id', { limit: 10 });

				expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith({ limit: -1 }, undefined);
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

	describe('folder type restrictions', () => {
		const nonAdmin = { admin: false, user: 'user-123' } as Accountability;
		const admin = { admin: true, user: 'user-123' } as Accountability;

		function mockKnex(restricted: { id: string } | undefined) {
			const chain: Record<string, any> = {};

			chain['select'] = vi.fn(() => chain);
			chain['from'] = vi.fn(() => chain);
			chain['whereIn'] = vi.fn(() => chain);
			chain['andWhereNot'] = vi.fn(() => chain);
			chain['first'] = vi.fn().mockResolvedValue(restricted);

			return chain;
		}

		function service(accountability: Accountability | null, restricted?: { id: string }) {
			return new FoldersService({
				schema: mockSchema,
				accountability,
				knex: mockKnex(restricted) as any,
			});
		}

		test('blocks a non-admin creating a non-files folder', async () => {
			await expect(service(nonAdmin).createOne({ name: 'Flows', type: 'flows' })).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
		});

		test('lets a non-admin create a file library folder', async () => {
			await service(nonAdmin).createOne({ name: 'Images' });

			expect(ItemsService.prototype.createOne).toHaveBeenCalled();
		});

		test('lets an admin create a flows folder', async () => {
			await service(admin).createOne({ name: 'Flows', type: 'flows' });

			expect(ItemsService.prototype.createOne).toHaveBeenCalled();
		});

		test('blocks a non-admin retyping a folder to flows', async () => {
			await expect(service(nonAdmin).updateMany(['folder-1'], { type: 'flows' })).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});

		test('blocks a non-admin updating an existing flows folder', async () => {
			await expect(service(nonAdmin, { id: 'folder-1' }).updateMany(['folder-1'], { name: 'Renamed' })).rejects.toThrow(
				ForbiddenError,
			);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});

		test('lets a non-admin update a file library folder', async () => {
			await service(nonAdmin).updateMany(['folder-1'], { name: 'Renamed' });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalled();
		});

		test('blocks a non-admin deleting an existing flows folder', async () => {
			await expect(service(nonAdmin, { id: 'folder-1' }).deleteMany(['folder-1'])).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});

		test('scopes non-admin reads to the file library', async () => {
			await service(nonAdmin).readByQuery({ filter: { name: { _eq: 'Images' } } });

			expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
				{ filter: { _and: [{ name: { _eq: 'Images' } }, { type: { _eq: 'files' } }] } },
				undefined,
			);
		});

		test('leaves admin reads untouched', async () => {
			await service(admin).readByQuery({ filter: { name: { _eq: 'Images' } } });

			expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
				{ filter: { name: { _eq: 'Images' } } },
				undefined,
			);
		});
	});
});
