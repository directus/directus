<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { useFlowsStore } from '@/stores/flows';
import { FolderTarget } from '@/types/folders';
import FilesNavigation from '@/views/private/components/files-navigation.vue';

defineProps<{
	currentFolder?: string;
}>();

const router = useRouter();
const flowsStore = useFlowsStore();

const { updateAllowed, deleteAllowed } = useCollectionPermissions('directus_folders');

function navigateToFolder(target: FolderTarget) {
	if (target.folder) {
		router.push({ name: 'flows-folder', params: { folder: target.folder } });
	} else {
		router.push({ name: 'flows-collection' });
	}
}

// Deleting a folder detaches its flows in the database, so re-hydrate before navigating
async function onFolderDeleted(parent: string | null) {
	await flowsStore.hydrate();
	navigateToFolder({ folder: parent ?? undefined });
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
		:deleted-handler="onFolderDeleted"
	/>
</template>
