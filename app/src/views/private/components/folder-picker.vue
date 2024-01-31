<script setup lang="ts">
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FolderPickerListItem from './folder-picker-list-item.vue';

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

const props = defineProps<{
	modelValue: string | null;
	disabledFolders?: string[];
}>();

defineEmits<{
	'update:modelValue': [value: string | null];
}>();

const { t } = useI18n();

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
const selectedFolder = folders.value.find((folder) => folder.id === props.modelValue);

if (selectedFolder && selectedFolder.parent) parseFolder(selectedFolder.parent);

const startOpenFolders = ['root'];

for (const folderID of shouldBeOpen) {
	if (startOpenFolders.includes(folderID) === false) {
		startOpenFolders.push(folderID);
	}
}

const openFolders = ref(startOpenFolders);

fetchFolders();

async function fetchFolders() {
	if (folders.value.length > 0) return;
	loading.value = true;

	try {
		folders.value = await fetchAll<{
			id: string;
			name: string;
			parent: string | null;
		}>(`/folders`, {
			params: {
				limit: -1,
				sort: 'name',
			},
		});
	} catch (error) {
		unexpectedError(error);
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
</script>

<template>
	<v-skeleton-loader v-if="loading" />
	<div v-else class="folder-picker">
		<v-list>
			<v-item-group v-model="openFolders" scope="folder-picker" multiple>
				<v-list-group
					disable-groupable-parent
					clickable
					:active="modelValue === null"
					scope="folder-picker"
					value="root"
					@click="$emit('update:modelValue', null)"
				>
					<template #activator>
						<v-list-item-icon>
							<v-icon name="folder_special" outline />
						</v-list-item-icon>
						<v-list-item-content>{{ t('file_library') }}</v-list-item-content>
					</template>

					<folder-picker-list-item
						v-for="folder in tree"
						:key="folder.id"
						:folder="folder"
						:current-folder="modelValue"
						:click-handler="(id) => $emit('update:modelValue', id)"
						:disabled="disabledFolders?.includes(folder.id)"
						:disabled-folders="disabledFolders"
					/>
				</v-list-group>
			</v-item-group>
		</v-list>
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--folder-picker-background-color  [var(--theme--background-normal)]
		--folder-picker-color             [var(--theme--background-accent)]

*/

.folder-picker {
	--v-list-item-background-color-hover: var(--folder-picker-color, var(--theme--background-accent));
	--v-list-item-background-color-active: var(--folder-picker-color, var(--theme--background-accent));

	padding: 12px;
	background-color: var(--folder-picker-background-color, var(--theme--background-normal));
	border-radius: var(--theme--border-radius);
	max-height: calc(var(--input-height-tall) * 2);
	overflow: auto;
}
</style>
