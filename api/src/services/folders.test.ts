import type { Accountability, Folder, SchemaOverview } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { FoldersService } from './folders.js';

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

import { ItemsService } from './items.js';

describe('FoldersService', () => {
	const mockSchema = {
		collections: {},
		relations: [],
	} as SchemaOverview;

	const foldersService = new FoldersService({
		schema: mockSchema,
	});

	vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
		{ id: 'root', name: 'Root', parent: null },
		{ id: 'root2', name: 'Root2', parent: null },
		{ id: 'a', name: 'FolderA', parent: 'root' },
		{ id: 'a1', name: 'FolderA', parent: 'root' },
		{ id: 'a2', name: null, parent: 'root' } as unknown as Folder,
		{ id: 'b', name: 'FolderB', parent: 'root' },
		{ id: 'c', name: 'FolderC', parent: 'a' },
		{ id: 'd', name: 'FolderD', parent: 'a' },
		{ id: 'e', name: 'FolderE', parent: 'b' },
		{ id: 'f', name: 'FolderA', parent: 'b' },
	]);

	test('should build a tree with root', async () => {
		const tree = await foldersService.buildTree('root');
		expect(tree.get('root')).toBe('Root');
	});

	test('should build nested folder paths', async () => {
		const tree = await foldersService.buildTree('root');

		expect(tree.get('root')).toBe('Root');
		expect(tree.get('a')).toBe('Root/FolderA (1)');
		expect(tree.get('b')).toBe('Root/FolderB');
		expect(tree.get('d')).toBe('Root/FolderA (1)/FolderD');
		expect(tree.get('f')).toBe('Root/FolderB/FolderA');
	});

	test('should deduplicate folder names within same parent', async () => {
		const tree = await foldersService.buildTree('root');

		expect(tree.get('a1')).toBe('Root/FolderA');
		expect(tree.get('a')).toBe('Root/FolderA (1)');
	});

	test('should fallback to folder ID if name is restricted', async () => {
		const tree = await foldersService.buildTree('root');

		expect(tree.get('root')).toBe('Root');
		expect(tree.get('a2')).toBe('Root/a2');
	});

	test('should call validateAccess for non-admin users', async () => {
		ItemsService.prototype.accountability = { admin: false, user: '123' } as Accountability;

		await foldersService.buildTree('root');

		expect(validateAccess).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'directus_folders',
				primaryKeys: ['root'],
			}),
			expect.anything(),
		);
	});

	test('should not fail if folder has no children', async () => {
		const singleFolder: Folder[] = [{ id: 'root', name: 'root', parent: null }];
		vi.spyOn(FoldersService.prototype, 'readByQuery').mockResolvedValue(singleFolder);

		const tree = await foldersService.buildTree('root');

		expect(tree.size).toBe(1);
		expect(tree.get('root')).toBe('root');
	});

	test('should not process folders with null parent', async () => {
		const tree = await foldersService.buildTree('root');
		expect(tree.get('root2')).toBe(undefined);
	});
});
