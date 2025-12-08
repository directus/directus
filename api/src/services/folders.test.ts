import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { FoldersService } from './folders.js';

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

import { ForbiddenError } from '@directus/errors';
import { ItemsService } from './items.js';

describe('FoldersService', () => {
	const mockSchema = {
		collections: {},
		relations: [],
	} as SchemaOverview;

	const foldersService = new FoldersService({
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
				const accountability = { admin: false, user: 'user-123' };
				ItemsService.prototype.accountability = { admin: false, user: 'user-123' } as Accountability;

				vi.mocked(validateAccess).mockRejectedValue(new ForbiddenError());

				await expect(foldersService.buildTree('root-1')).rejects.toThrow(ForbiddenError);

				expect(vi.mocked(validateAccess)).toHaveBeenCalledWith(
					{
						collection: 'directus_folders',
						accountability,
						action: 'read',
						primaryKeys: ['root-1'],
					},
					{
						knex: ItemsService.prototype.knex,
						schema: ItemsService.prototype.schema,
					},
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
				ItemsService.prototype.accountability = { admin: true, user: 'user-123' } as Accountability;

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 'root-id', name: 'parent', parent: null },
				]);

				await foldersService.buildTree('root-1');

				expect(vi.mocked(validateAccess)).not.toHaveBeenCalled();
			});

			test('skips validation for admin users (null)', async () => {
				ItemsService.prototype.accountability = null;

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
});
