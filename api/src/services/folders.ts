import type { AbstractServiceOptions, Folder } from '@directus/types';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { NameDeduper } from './assets/name-deduper.js';
import { ItemsService } from './items.js';

export class FoldersService extends ItemsService<Folder> {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}

	async tree(root: string) {
		if (this.accountability && this.accountability.admin !== true) {
			await validateAccess(
				{
					collection: 'directus_folders',
					accountability: this.accountability,
					action: 'read',
					primaryKeys: [root],
				},
				{
					knex: this.knex,
					schema: this.schema,
				},
			);
		}

		const folders = await this.readByQuery({});

		// build folder and child lookup
		const folderLookup = new Map<string, Folder>();
		const childFolderLookup = new Map<string, string[]>();

		for (const folder of folders) {
			if (!folder['id']) continue;

			folderLookup.set(folder['id'], folder);

			if (folder['parent'] && folder['id'] !== root) {
				const children = childFolderLookup.get(folder['parent']) ?? [];

				children.push(folder['id']);

				childFolderLookup.set(folder['parent'], children);
			}
		}

		const deduper = new NameDeduper();
		const rootName = folderLookup.get(root)?.name ?? root;
		const stack = [[root, '']];
		const tree = new Map<string, string>();

		while (stack.length > 0) {
			const [folderId, path] = stack.pop() ?? [];

			if (!folderId) continue;

			const folder = folderLookup.get(folderId);

			if (!folder) continue;

			const children = childFolderLookup.get(folderId);

			const folderName = deduper.add(folder['name'] ?? folderId, folder['parent']);

			const folderPath = path === '' ? rootName : `${path}/${folderName}`;

			tree.set(folderId, folderPath);

			for (const childFolderId of children ?? []) {
				stack.push([childFolderId, folderPath]);
			}
		}

		return tree;
	}
}
