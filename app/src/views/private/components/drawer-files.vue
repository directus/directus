<script setup lang="ts">
import { Filter } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DrawerCollection from './drawer-collection.vue';
import { useUserStore } from '@/stores/user';
import { FolderTarget, SpecialFolder } from '@/types/folders';
import { getFolderFilter } from '@/utils/get-folder-filter';
import FilesNavigation from '@/views/private/components/files-navigation.vue';

const props = withDefaults(
	defineProps<{
		collection?: string;
		folder?: string;
		filter?: Filter;
	}>(),
	{
		collection: 'directus_files',
	},
);

const { t } = useI18n();

const drawerProps = {
	sidebarLabel: t('folders'),
};

const currentFolder = ref<string | undefined>(props.folder);
const currentSpecial = ref<SpecialFolder>();
const folderFilter = ref<Filter>();

const userStore = useUserStore();

watch(
	[currentFolder, currentSpecial],
	() => {
		folderFilter.value = getFolderFilter(currentFolder.value, currentSpecial.value, userStore?.currentUser?.id);
	},
	{ immediate: true },
);

function onFolderChange(target: FolderTarget) {
	currentFolder.value = target.folder;
	currentSpecial.value = target.special;
}
</script>

<template>
	<DrawerCollection
		v-bind="$attrs"
		:collection="collection"
		:drawer-props="drawerProps"
		:filter="mergeFilters(filter ?? null, folderFilter ?? null)"
	>
		<template #sidebar>
			<FilesNavigation
				:custom-target-handler="onFolderChange"
				:current-folder="currentFolder"
				:current-special="currentSpecial"
				:root-folder="folder"
				local-open-folders
				actions-disabled
			/>
		</template>
	</DrawerCollection>
</template>
