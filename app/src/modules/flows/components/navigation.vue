<script setup lang="ts">
import { navigateToFolder } from '../navigate-to-folder';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { useFlowsStore } from '@/stores/flows';
import FilesNavigation from '@/views/private/components/files-navigation.vue';

defineProps<{
	currentFolder?: string;
}>();

const flowsStore = useFlowsStore();

const { updateAllowed, deleteAllowed } = useCollectionPermissions('directus_folders');

// Deleting a folder detaches its flows in the database, so re-hydrate before navigating
async function onFolderDeleted(parent: string | null) {
	await flowsStore.hydrate();
	navigateToFolder(parent);
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
		:custom-target-handler="(target) => navigateToFolder(target.folder)"
		:deleted-handler="onFolderDeleted"
	/>
</template>
