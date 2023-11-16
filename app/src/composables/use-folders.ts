import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import { Ref, computed, ref, watch } from 'vue';

export type FolderRaw = {
	id: string;
	name: string;
	parent: string | null;
};

export type Folder = {
	id: string;
	name: string;
	parent: string | null;
	children?: Folder[];
};

type UsableFolders = {
	loading: Ref<boolean>;
	folders: Ref<Folder[] | null>;
	nestedFolders: Ref<Folder[] | null>;
	fetchFolders: () => Promise<void>;
	openFolders: Ref<string[] | null>;
};

const OPEN_FOLDERS_INITIAL = ['root'];

const loading = ref(false);
const folders = ref<Folder[] | null>(null);
const globalNestedFolders = ref<Folder[] | null>(null);
const globalOpenFolders = ref(OPEN_FOLDERS_INITIAL);

export function useFolders(rootFolder?: Ref<string | undefined>, local?: Ref<boolean>): UsableFolders {
	const nestedFolders = computed(() => {
		return findFolder(globalNestedFolders.value, rootFolder?.value);
	});

	const localOpenFolders = ref(getRootFolderOpenFolders(rootFolder?.value));

	const openFolders = computed({
		get() {
			if (!rootFolder?.value && !local?.value) return globalOpenFolders.value;

			return localOpenFolders.value;
		},
		set(value) {
			if (!rootFolder?.value && !local?.value) {
				globalOpenFolders.value = value;
			} else {
				localOpenFolders.value = value;
			}
		},
	});

	if (rootFolder) {
		watch(rootFolder, (newValue, oldValue) => {
			if (newValue && oldValue === undefined) localOpenFolders.value = getRootFolderOpenFolders(newValue);
		});
	}

	if (folders.value === null) {
		fetchFolders();
	}

	return { loading, folders, nestedFolders, fetchFolders, openFolders };

	async function fetchFolders() {
		if (loading.value === true) return;

		loading.value = true;

		try {
			const response = await fetchAll<Folder>(`/folders`, {
				params: {
					sort: 'name',
				},
			});

			folders.value = response;
			globalNestedFolders.value = nestFolders(response as FolderRaw[]);
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}

export function nestFolders(rawFolders: FolderRaw[]): FolderRaw[] {
	return rawFolders.map((rawFolder) => nestChildren(rawFolder, rawFolders)).filter((folder) => folder.parent === null);
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

function findFolder(folders: Folder[] | null, id: string | undefined): Folder[] | null {
	if (!folders) return null;
	if (!id) return folders;

	for (const folder of folders) {
		if (folder.id === id) return folder.children ?? null;

		if (folder.children) {
			const result = findFolder(folder.children, id);
			if (result) return result;
		}
	}

	return null;
}

function getRootFolderOpenFolders(rootFolder: string | undefined) {
	return rootFolder ? [rootFolder] : OPEN_FOLDERS_INITIAL;
}
