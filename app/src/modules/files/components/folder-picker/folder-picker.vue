<template>
	<v-skeleton-loader v-if="loading" />
	<div class="folder-picker" v-else>
		<v-list dense>
			<v-list-group open @click="$emit('input', null)" :active="value === null">
				<template #activator>
					<v-list-item-icon>
						<v-icon name="folder_special" />
					</v-list-item-icon>
					<v-list-item-content>{{ $t('file_library') }}</v-list-item-content>
				</template>

				<folder-picker-list-item
					v-for="folder in tree"
					:key="folder.id"
					:folder="folder"
					:current-folder="value"
					:click-handler="(id) => $emit('input', id)"
					:disabled="disabledFolders.includes(folder.id)"
					:disabled-folders="disabledFolders"
					:open="startOpenFolders.includes(folder.id)"
					:start-open-folders="startOpenFolders"
				/>
			</v-list-group>
		</v-list>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import api from '@/api';
import FolderPickerListItem from './folder-picker-list-item.vue';

type FolderRaw = {
	id: string;
	name: string;
	parent_folder: null | string;
};

type Folder = {
	id: string;
	name: string;
	children: Folder[];
};

export default defineComponent({
	components: { FolderPickerListItem },
	props: {
		disabledFolders: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const loading = ref(false);
		const folders = ref<FolderRaw[]>([]);
		const error = ref<any>(null);
		const tree = computed<Folder[]>(() => {
			return folders.value
				.filter((folder) => folder.parent_folder === null)
				.map((folder) => {
					return {
						...folder,
						children: getChildFolders(folder),
					};
				});

			function getChildFolders(folder: FolderRaw): Folder[] {
				return folders.value
					.filter((childFolder) => {
						return childFolder.parent_folder === folder.id;
					})
					.map((childFolder) => {
						return {
							...childFolder,
							children: getChildFolders(childFolder),
						};
					});
			}
		});

		const startOpenFolders = computed(() => {
			if (!folders.value) return [];

			const openFolders: string[] = [];
			const folder = folders.value.find((folder) => folder.id === props.value);

			if (folder && folder.parent_folder) parseFolder(folder.parent_folder);

			return openFolders;

			function parseFolder(id: string) {
				if (!folders.value) return;
				openFolders.push(id);

				const folder = folders.value.find((folder) => folder.id === id);

				if (folder && folder.parent_folder) {
					parseFolder(folder.parent_folder);
				}
			}
		});

		const selectedFolder = computed(() => {
			return folders.value.find((folder) => folder.id === props.value) || {};
		});

		fetchFolders();

		return { loading, folders, tree, selectedFolder, startOpenFolders };

		async function fetchFolders() {
			if (folders.value.length > 0) return;
			loading.value = true;

			try {
				const response = await api.get(`/folders`, {
					params: {
						limit: -1,
						sort: 'name',
					},
				});

				folders.value = response.data.data;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.folder-picker {
	padding: 12px;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
}
</style>
