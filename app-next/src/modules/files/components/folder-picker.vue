<template>
	<v-skeleton-loader v-if="loading" />
	<div class="folder-picker" v-else>
		<v-list>
			<v-item-group scope="folder-picker" multiple v-model="openFolders">
				<v-list-group
					disable-groupable-parent
					@click="$emit('input', null)"
					:active="value === null"
					scope="folder-picker"
					value="root"
				>
					<template #activator>
						<v-list-item-icon>
							<v-icon name="folder_special" outline />
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
					/>
				</v-list-group>
			</v-item-group>
		</v-list>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import api from '@/api';
import FolderPickerListItem from './folder-picker-list-item.vue';
import { unexpectedError } from '@/utils/unexpected-error';

type FolderRaw = {
	id: string;
	name: string;
	parent: null | string;
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
		const tree = computed<Folder[]>(() => {
			return folders.value
				.filter((folder) => folder.parent === null)
				.map((folder) => {
					return {
						...folder,
						children: getChildFolders(folder),
					};
				});

			function getChildFolders(folder: FolderRaw): Folder[] {
				return folders.value
					.filter((childFolder) => {
						return childFolder.parent === folder.id;
					})
					.map((childFolder) => {
						return {
							...childFolder,
							children: getChildFolders(childFolder),
						};
					});
			}
		});

		const shouldBeOpen: string[] = [];
		const folder = folders.value.find((folder) => folder.id === props.value);

		if (folder && folder.parent) parseFolder(folder.parent);

		const startOpenFolders = ['root'];

		for (const folderID of shouldBeOpen) {
			if (startOpenFolders.includes(folderID) === false) {
				startOpenFolders.push(folderID);
			}
		}
		const selectedFolder = computed(() => {
			return folders.value.find((folder) => folder.id === props.value) || {};
		});

		const openFolders = ref(startOpenFolders);

		fetchFolders();

		return { loading, folders, tree, selectedFolder, openFolders };

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
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
		}

		function parseFolder(id: string) {
			if (!folders.value) return;
			shouldBeOpen.push(id);

			const folder = folders.value.find((folder) => folder.id === id);

			if (folder && folder.parent) {
				parseFolder(folder.parent);
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
