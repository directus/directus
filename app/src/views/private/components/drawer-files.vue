<template>
	<drawer-collection
		v-bind="$attrs"
		:collection="collection"
		:drawer-props="drawerProps"
		:filter="mergeFilters(filter, folderFilter)"
	>
		<template v-if="!folder" #sidebar>
			<files-navigation
				:custom-target-handler="onFolderChange"
				:current-folder="currentFolder"
				:current-special="currentSpecial"
				local-open-folders
				actions-disabled
			/>
		</template>
	</drawer-collection>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import FilesNavigation from '@/views/private/components/files-navigation.vue';
import { getFolderFilter } from '@/utils/get-folder-filter';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { FolderTarget, SpecialFolder } from '@/types/folders';
import { Filter } from '@directus/types';
import { mergeFilters } from '@directus/utils';

const props = withDefaults(defineProps<{ collection?: string; folder?: string; filter?: Filter }>(), {
	collection: 'directus_files',
});

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
	{ immediate: true }
);

function onFolderChange(target: FolderTarget) {
	currentFolder.value = target.folder;
	currentSpecial.value = target.special;
}
</script>
