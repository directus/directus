import { fetchAll } from '@/utils/fetch-all';
import { MaybeRef, ref, Ref, toRef, watch } from 'vue';

export type FolderRaw = {
	id: string;
	name: string;
	parent: string | null;
};

export type Folder = {
	id: string | null;
	name: string;
	parent: string | null;
	children?: Folder[];
};

type UsableFolders = {
	loading: Ref<boolean>;
	folders: Ref<Folder[] | null>;
	nestedFolders: Ref<Folder[] | null>;
	error: Ref<any>;
	fetchFolders: () => Promise<void>;
	openFolders: Ref<string[] | null>;
};

export const openFoldersInitial = ['root'];

export function useFolders(rootFolder?: MaybeRef<string | undefined>): UsableFolders {
	const _rootFolder = toRef(rootFolder);

	const loading = ref(false);
	const folders = ref<Folder[] | null>(null);
	const nestedFolders = ref<Folder[] | null>(null);
	const error = ref(null);
	let openFolders: Ref<string[] | null> | null = null;

	if (openFolders === null) {
		if (_rootFolder.value === undefined) {
			openFolders = ref(openFoldersInitial);
		} else {
			openFolders = ref([_rootFolder.value]);
		}
	}

	if (folders.value === null && loading.value === false) {
		if (_rootFolder.value === undefined) {
			fetchFolders();
		} else {
			watch(
				_rootFolder,
				(newRootFolder) => {
					fetchFolders(newRootFolder);
				},
				{ immediate: true }
			);
		}
	}

	return { loading, folders, nestedFolders, error, fetchFolders, openFolders };

	async function fetchFolders(rootFolder?: string) {
		if (loading.value === true) return;

		loading.value = true;

		try {
			const response = await fetchAll<Folder>(`/folders`, {
				params: {
					sort: 'name',
				},
			});

			folders.value = response;
			nestedFolders.value = nestFolders(response as FolderRaw[], rootFolder);
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}

export function nestFolders(rawFolders: FolderRaw[], rootFolder?: string): FolderRaw[] {
	return rawFolders.reduce<FolderRaw[]>((acc, rawFolder) => {
		if (rawFolder.parent === (rootFolder ?? null)) {
			acc.push(nestChildren(rawFolder, rawFolders));
		}

		return acc;
	}, []);
}

export function nestChildren(rawFolder: FolderRaw, rawFolders: FolderRaw[]): FolderRaw & Folder {
	const folder: FolderRaw & Folder = { ...rawFolder };

	const children = rawFolders.reduce<FolderRaw[]>((acc, childFolder) => {
		if (childFolder.parent === rawFolder.id && childFolder.id !== rawFolder.id) {
			acc.push(nestChildren(childFolder, rawFolders));
		}

		return acc;
	}, []);

	if (children.length > 0) {
		folder.children = children;
	}

	return folder;
}
