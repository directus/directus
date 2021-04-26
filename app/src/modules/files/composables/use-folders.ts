import api from '@/api';
import { ref, Ref } from '@vue/composition-api';
import { TranslateResult } from 'vue-i18n';

type FolderRaw = {
	id: string;
	name: string;
	parent: string | null;
};

export type Folder = {
	id: string | null;
	name: string | TranslateResult;
	parent: string | null;
	children?: Folder[];
};

let loading: Ref<boolean> | null = null;
let folders: Ref<Folder[] | null> | null = null;
let nestedFolders: Ref<Folder[] | null> | null = null;
let openFolders: Ref<string[] | null> | null = null;

let error: Ref<any> | null = null;

export default function useFolders(): Record<string, any> {
	if (loading === null) loading = ref(false);
	if (folders === null) folders = ref<Folder[] | null>(null);
	if (nestedFolders === null) nestedFolders = ref<Folder[] | null>(null);
	if (error === null) error = ref(null);
	if (openFolders === null) openFolders = ref(['root']);

	if (folders.value === null && loading.value === false) {
		fetchFolders();
	}

	return { loading, folders, nestedFolders, error, fetchFolders, openFolders };

	async function fetchFolders() {
		if (loading === null) return;
		if (folders === null) return;
		if (nestedFolders === null) return;
		if (error === null) return;

		loading.value = true;

		try {
			const response = await api.get(`/folders`, {
				params: {
					limit: -1,
					sort: 'name',
				},
			});

			folders.value = response.data.data;
			nestedFolders.value = nestFolders(response.data.data);
		} catch (err) {
			error.value = err;
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

	const children = rawFolders
		.filter((childFolder) => childFolder.parent === rawFolder.id && childFolder.id !== rawFolder.id)
		.map((childRawFolder) => nestChildren(childRawFolder, rawFolders));

	if (children.length > 0) {
		folder.children = children;
	}

	return folder;
}
