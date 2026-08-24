import api from '@/api';
import { Folder } from '@/composables/use-folders';
import { collectAllFolderIds } from '@/utils/collect-folder-ids';

export async function moveSingleFolder(folder: Folder): Promise<void> {
	const newParent = folder.parent;

	const [foldersRes, filesRes] = await Promise.all([
		api.get('/folders', {
			params: { filter: { parent: { _eq: folder.id } }, fields: ['id'], limit: -1 },
		}),
		api.get('/files', {
			params: { filter: { folder: { _eq: folder.id } }, fields: ['id'], limit: -1 },
		}),
	]);

	const childFolderIds: string[] = foldersRes.data.data.map((f: { id: string }) => f.id);
	const childFileIds: string[] = filesRes.data.data.map((f: { id: string }) => f.id);

	await Promise.all([
		childFolderIds.length > 0
			? api.patch('/folders', { keys: childFolderIds, data: { parent: newParent } })
			: Promise.resolve(),
		childFileIds.length > 0
			? api.patch('/files', { keys: childFileIds, data: { folder: newParent } })
			: Promise.resolve(),
	]);
}

export async function moveAndDelete(folders: Folder[]): Promise<void> {
	await Promise.all(folders.map(moveSingleFolder));
	await api.delete('/folders', { data: folders.map((f) => f.id) });
}

export async function recursiveDelete(folders: Folder[], allFolders: Folder[]): Promise<void> {
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

	const filesRes = await api.get('/files', {
		params: { filter: { folder: { _in: allFolderIds } }, fields: ['id'], limit: -1 },
	});

	const fileIds: string[] = filesRes.data.data.map((f: { id: string }) => f.id);

	if (fileIds.length > 0) {
		await api.delete('/files', { data: fileIds });
	}

	await api.delete('/folders', { data: allFolderIds });
}
