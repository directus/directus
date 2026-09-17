import { ForbiddenError } from '@directus/errors';
import type { AbstractServiceOptions, Folder, MutationOptions, PrimaryKey, Query, QueryOptions } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { NameDeduper } from './assets/name-deduper.js';
import { ItemsService } from './items.js';

const FILE_LIBRARY_TYPE = 'files';

/** Every folder type but the file library is admin-only, which permissions can't express as they filter rows, not payloads. */
export class FoldersService extends ItemsService<Folder> {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}

	/** Null accountability is an internal call, trusted like an admin. */
	private get fileLibraryOnly(): boolean {
		return this.accountability !== null && this.accountability.admin !== true;
	}

	private assertAllowedType(data: Partial<Folder>): void {
		if (!this.fileLibraryOnly) {
			return;
		}

		if (data.type === undefined || data.type === FILE_LIBRARY_TYPE) {
			return;
		}

		throw new ForbiddenError({ reason: `You don't have permission to manage "${data.type}" folders.` });
	}

	private async assertAllowedKeys(keys: PrimaryKey[], action: 'update' | 'delete'): Promise<void> {
		if (!this.fileLibraryOnly || keys.length === 0) {
			return;
		}

		const restricted = await this.knex
			.select('id')
			.from('directus_folders')
			.whereIn('id', keys)
			.andWhereNot('type', FILE_LIBRARY_TYPE)
			.first();

		if (restricted) {
			throw new ForbiddenError({ reason: `You don't have permission to ${action} this folder.` });
		}
	}

	override async createOne(data: Partial<Folder>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		this.assertAllowedType(data);
		return super.createOne(data, opts);
	}

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Folder>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		this.assertAllowedType(data);
		await this.assertAllowedKeys(keys, 'update');
		return super.updateMany(keys, data, opts);
	}

	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		await this.assertAllowedKeys(keys, 'delete');
		return super.deleteMany(keys, opts);
	}

	scopeQuery<T extends Pick<Query, 'filter'>>(query: T): T {
		if (!this.fileLibraryOnly) {
			return query;
		}

		return { ...query, filter: mergeFilters(query.filter ?? null, { type: { _eq: FILE_LIBRARY_TYPE } }) };
	}

	override async readByQuery(query: Query, opts?: QueryOptions): Promise<Folder[]> {
		return super.readByQuery(this.scopeQuery(query), opts);
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
	async buildTree(root: string, query?: Pick<Query, 'filter'>) {
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
			filter: query?.filter ?? null,
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
