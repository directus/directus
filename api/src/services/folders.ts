import { ForbiddenError } from '@directus/errors';
import type { AbstractServiceOptions, Folder, MutationOptions, PrimaryKey, Query, QueryOptions } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { isAdmin } from '../utils/is-admin.js';
import { NameDeduper } from './assets/name-deduper.js';
import { ItemsService } from './items.js';

/** Every folder type but the file library is admin-only, which permissions can't express as they filter rows, not payloads. */
export class FoldersService extends ItemsService<Folder> {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}

	private async checkFlowsFolders(keys: PrimaryKey[], action: 'update' | 'delete'): Promise<void> {
		if (keys.length === 0 || isAdmin(this.accountability)) {
			return;
		}

		const folders = await this.knex
			.select('name')
			.from('directus_folders')
			.whereIn('id', keys)
			.andWhere('type', 'flows');

		if (folders.length === 0) return;

		throw new ForbiddenError({
			reason: `You don't have permission to ${action} the [${folders.map((folder) => folder.name).join(', ')}] folders.`,
		});
	}

	override async createOne(data: Partial<Folder>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		if (!isAdmin(this.accountability) && data.type === 'flows') {
			throw new ForbiddenError({ reason: `You don't have permission to manage flows folders.` });
		}

		return super.createOne(data, opts);
	}

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Folder>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		if (!isAdmin(this.accountability) && data.type === 'flows') {
			throw new ForbiddenError({ reason: `You don't have permission to manage flows folders.` });
		}

		await this.checkFlowsFolders(keys, 'update');

		return super.updateMany(keys, data, opts);
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		await this.checkFlowsFolders(keys, 'delete');

		return super.deleteMany(keys, opts);
	}

	override async readByQuery(query: Query, opts?: QueryOptions): Promise<Folder[]> {
		if (!isAdmin(this.accountability)) {
			query.filter = mergeFilters(query.filter ?? null, { type: { _neq: 'flows' } });
		}

		return super.readByQuery(query, opts);
	}

	/**
	 * Builds a full folder tree starting from a given root folder.
	 *
	 * This method returns a map of folder IDs to their corresponding paths
	 * relative to the root. It resolves all nested child folders and ensures
	 * that folder names are deduplicated within the same parent.
	 *
	 * Access control is applied automatically when non-admin, only folders the user has `read`
	 * access to are included.
	 *
	 * @param {string} root - The ID of the root folder to start building the tree from.
	 * @param {Pick<Query, 'filter'>} [query] - Optional filter scoping which folders are read (e.g. by `type`).
	 *   Only the filter is honoured: the whole tree is always needed, and the walk owns the fields it reads.
	 * @returns {Promise<Map<string, string>>} A `Map` where:
	 *   - Key: folder ID
	 *   - Value: folder path relative to the root (e.g., "Documents/Photos")
	 *
	 * @example
	 * const foldersService = new FoldersService({ schema, accountability });
	 * const tree = await foldersService.buildTree('root-folder-id');
	 * console.log(tree.get('folder1')); // e.g., "RootFolder/SubFolder1"
	 *
	 * @remarks
	 * - The returned `Map` includes the root folder itself.
	 * - If a folder has no name, its ID will be used as a fallback.
	 */
	async buildTree(root: string, type: 'files' | 'flows' = 'files') {
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

		const folders = await this.readByQuery({
			filter: { type: { _eq: type } },
			fields: ['id', 'parent', 'name'],
			limit: -1,
		});

		// build folder and child lookup
		const folderLookup = new Map<string, Folder>();
		const childFolderLookup = new Map<string, string[]>();

		for (const folder of folders) {
			if (!folder['id']) continue;

			folderLookup.set(folder['id'], folder);

			// root is always at the top level, we can therfor safely skip any parent references to it.
			if (folder['parent'] && folder['id'] !== root) {
				const children = childFolderLookup.get(folder['parent']) ?? [];

				children.push(folder['id']);

				childFolderLookup.set(folder['parent'], children);
			}
		}

		const deduper = new NameDeduper();
		const rootName = deduper.add(folderLookup.get(root)?.name, { fallback: root });
		const stack = [[root, '']];
		const tree = new Map<string, string>();

		// build tree from stack
		while (stack.length > 0) {
			const [folderId, path] = stack.pop() ?? [];

			if (!folderId) continue;

			const folder = folderLookup.get(folderId);

			if (!folder) continue;

			const children = childFolderLookup.get(folderId);

			const folderName = deduper.add(folder['name'], { group: folder['parent'], fallback: folderId });

			const folderPath = path === '' ? rootName : `${path}/${folderName}`;

			tree.set(folderId, folderPath);

			for (const childFolderId of children ?? []) {
				stack.push([childFolderId, folderPath]);
			}
		}

		return tree;
	}
}
