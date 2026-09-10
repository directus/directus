import api from '@/api';
import { Folder, FolderType } from '@/composables/use-folders';
import { collectAllFolderIds } from '@/utils/collect-folder-ids';

/**
 * Describes which items a folder contains and what happens to them when the folder is deleted.
 *
 * - `collection`/`field`: the collection holding the folder's items and the field pointing at the
 *   folder.
 * - `onDeleteContents`: `'delete'` removes contained items with the folder,
 *   `'detach'` keeps them and clears their folder so they fall back to root level.
 */
type DeleteFolderConfig = {
	collection: string;
	field: string;
	onDeleteContents: 'delete' | 'detach';
};

const CONFIGS: Record<FolderType, DeleteFolderConfig> = {
	assets: { collection: 'files', field: 'folder', onDeleteContents: 'delete' },
	// Flow folders never delete their contained flows — a deleted folder drops its flows back to root
	flows: { collection: 'flows', field: 'folder', onDeleteContents: 'detach' },
};

export async function moveSingleFolder(folder: Folder, type: FolderType): Promise<void> {
	const config = CONFIGS[type];
	const newParent = folder.parent;

	const [foldersRes, itemsRes] = await Promise.all([
		api.get('/folders', {
			params: { filter: { parent: { _eq: folder.id } }, fields: ['id'], limit: -1 },
		}),
		api.get(`/${config.collection}`, {
			params: { filter: { [config.field]: { _eq: folder.id } }, fields: ['id'], limit: -1 },
		}),
	]);

	const childFolderIds: string[] = foldersRes.data.data.map((f: { id: string }) => f.id);
	const childItemIds: string[] = itemsRes.data.data.map((f: { id: string }) => f.id);

	await Promise.all([
		childFolderIds.length > 0
			? api.patch('/folders', { keys: childFolderIds, data: { parent: newParent } })
			: Promise.resolve(),
		childItemIds.length > 0
			? api.patch(`/${config.collection}`, { keys: childItemIds, data: { [config.field]: newParent } })
			: Promise.resolve(),
	]);
}

export async function moveAndDelete(folders: Folder[], type: FolderType): Promise<void> {
	await Promise.all(folders.map((folder) => moveSingleFolder(folder, type)));
	await api.delete('/folders', { data: folders.map((f) => f.id) });
}

export async function recursiveDelete(folders: Folder[], allFolders: Folder[], type: FolderType): Promise<void> {
	const config = CONFIGS[type];

	const allFolderIds = collectAllFolderIds(
		allFolders,
		folders.map((f) => f.id),
	);

	const allFolderIdSet = new Set(allFolderIds);

	const withParentInSet = allFolders
		.filter((f) => allFolderIdSet.has(f.id) && f.parent !== null && allFolderIdSet.has(f.parent!))
		.map((f) => f.id);

	if (withParentInSet.length > 0) {
		await api.patch('/folders', { keys: withParentInSet, data: { parent: null } });
	}

	const itemsRes = await api.get(`/${config.collection}`, {
		params: { filter: { [config.field]: { _in: allFolderIds } }, fields: ['id', config.field], limit: -1 },
	});

	const items: Record<string, string>[] = itemsRes.data.data;

	if (items.length > 0) {
		if (config.onDeleteContents === 'detach') {
			await detachItems(items, allFolders, allFolderIdSet, config);
		} else {
			await api.delete(`/${config.collection}`, { data: items.map((item) => item.id) });
		}
	}

	await api.delete('/folders', { data: allFolderIds });
}

/**
 * Walks up from `folderId` until it finds an ancestor that isn't being deleted, or runs out of
 * ancestors. Returns `null` when nothing above survives, which puts the item at root level.
 */
function findSurvivingParent(folderId: string, parentById: Map<string, string | null>, deleted: Set<string>) {
	let candidate = parentById.get(folderId) ?? null;

	while (candidate !== null && deleted.has(candidate)) {
		candidate = parentById.get(candidate) ?? null;
	}

	return candidate;
}

/**
 * Contained items are never deleted with their folder — each one moves to the nearest folder that
 * survives the delete, so a flow nested three levels deep resurfaces beside the deleted subtree
 * rather than at root level.
 */
async function detachItems(
	items: Record<string, string>[],
	allFolders: Folder[],
	deleted: Set<string>,
	config: DeleteFolderConfig,
): Promise<void> {
	const parentById = new Map(allFolders.map((folder) => [folder.id, folder.parent]));
	const keysByDestination = new Map<string | null, string[]>();

	for (const item of items) {
		const destination = findSurvivingParent(item[config.field]!, parentById, deleted);
		const keys = keysByDestination.get(destination);

		if (keys) {
			keys.push(item.id!);
		} else {
			keysByDestination.set(destination, [item.id!]);
		}
	}

	await Promise.all(
		[...keysByDestination].map(([destination, keys]) =>
			api.patch(`/${config.collection}`, { keys, data: { [config.field]: destination } }),
		),
	);
}
