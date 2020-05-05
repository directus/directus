import api from '@/api';
import { ref, Ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';

type FolderRaw = {
	id: number;
	name: string;
	parent_folder: number;
};

export type Folder = {
	id: number;
	name: string;
	children?: Folder[];
};

let loading: Ref<boolean> | null = null;
let folders: Ref<Folder[] | null> | null = null;

let error: Ref<any> | null = null;

export default function useFolders() {
	const projectsStore = useProjectsStore();

	if (loading === null) loading = ref(false);
	if (folders === null) folders = ref<Folder[]>(null);
	if (error === null) error = ref(null);

	if (folders.value === null && loading.value === false) {
		fetchFolders();
	}

	return { loading, folders, error, fetchFolders };

	async function fetchFolders() {
		if (loading === null) return;
		if (folders === null) return;
		if (error === null) return;

		loading.value = true;

		try {
			const response = await api.get(`/${projectsStore.state.currentProjectKey}/folders`, {
				params: {
					limit: -1,
					sort: 'name',
				},
			});

			folders.value = nestFolders(response.data.data);
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}

export function nestFolders(rawFolders: FolderRaw[]) {
	return rawFolders
		.map((rawFolder) => nestChildren(rawFolder, rawFolders))
		.filter((folder) => folder.parent_folder === null);
}

export function nestChildren(rawFolder: FolderRaw, rawFolders: FolderRaw[]) {
	const folder: FolderRaw & Folder = { ...rawFolder };

	const children = rawFolders
		.filter((childFolder) => childFolder.parent_folder === rawFolder.id)
		.map((childRawFolder) => nestChildren(childRawFolder, rawFolders));

	if (children.length > 0) {
		folder.children = children;
	}

	return folder;
}
