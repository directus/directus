import api from '@/api';
import { Folder } from '@/composables/use-folders';
import { collectAllFolderIds } from '@/utils/collect-folder-ids';

/**
 * Describes which items a folder contains and what happens to them when the folder is deleted.
 *
 * - `collection`/`field`: the collection holding the folder's items and the field pointing at the
 *   folder (files via `folder`, flows via `folder`).
 * - `onDeleteContents`: `'delete'` removes contained items with the folder (file library),
 *   `'detach'` keeps them and clears their folder so they fall back to root level (flows).
 */
export type DeleteFolderConfig = {
	collection: string;
	field: string;
	onDeleteContents: 'delete' | 'detach';
};

const DEFAULT_CONFIG: DeleteFolderConfig = {
	collection: 'files',
	field: 'folder',
	onDeleteContents: 'delete',
};

export async function moveSingleFolder(folder: Folder, config: DeleteFolderConfig = DEFAULT_CONFIG): Promise<void> {
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

export async function moveAndDelete(folders: Folder[], config: DeleteFolderConfig = DEFAULT_CONFIG): Promise<void> {
	await Promise.all(folders.map((folder) => moveSingleFolder(folder, config)));
	await api.delete('/folders', { data: folders.map((f) => f.id) });
}

export async function recursiveDelete(
	folders: Folder[],
	allFolders: Folder[],
	config: DeleteFolderConfig = DEFAULT_CONFIG,
): Promise<void> {
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
		params: { filter: { [config.field]: { _in: allFolderIds } }, fields: ['id'], limit: -1 },
	});

	const itemIds: string[] = itemsRes.data.data.map((f: { id: string }) => f.id);

	if (itemIds.length > 0) {
		if (config.onDeleteContents === 'detach') {
			// Contained items are never deleted with the folder — they fall back to root level
			await api.patch(`/${config.collection}`, { keys: itemIds, data: { [config.field]: null } });
		} else {
			await api.delete(`/${config.collection}`, { data: itemIds });
		}
	}

	await api.delete('/folders', { data: allFolderIds });
}
