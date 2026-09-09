<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { FolderTarget } from '@/types/folders';
import FilesNavigation from '@/views/private/components/files-navigation.vue';

defineProps<{
	currentFolder?: string;
}>();

const emit = defineEmits<{
	deleted: [parent: string | null];
}>();

const router = useRouter();

const { updateAllowed, deleteAllowed } = useCollectionPermissions('directus_folders');

function navigateToFolder(target: FolderTarget) {
	if (target.folder) {
		router.push({ name: 'flows-folder', params: { folder: target.folder } });
	} else {
		router.push({ name: 'flows-collection' });
	}
}
</script>

<template>
	<FilesNavigation
		type="flows"
		:root-label="$t('all_flows')"
		:show-special-folders="false"
		:show-download="false"
		:current-folder="currentFolder"
		:actions-disabled="!updateAllowed && !deleteAllowed"
		:update-disabled="!updateAllowed"
		:delete-disabled="!deleteAllowed"
		:custom-target-handler="navigateToFolder"
		:deleted-handler="(parent) => emit('deleted', parent)"
	/>
</template>
