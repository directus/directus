<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AddFolder from '@/modules/files/components/add-folder.vue';
import { FolderTarget } from '@/types/folders';
import type { DeleteFolderConfig } from '@/utils/delete-folder';
import FilesNavigation from '@/views/private/components/files-navigation.vue';

defineProps<{
	currentFolder?: string;
	actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
	navigate: [folderId: string | null];
}>();

const { t } = useI18n();

// Flow folders never delete their contained flows — a deleted folder drops its flows back to root
const deleteConfig: DeleteFolderConfig = { collection: 'flows', field: 'folder', onDeleteContents: 'detach' };

function onTarget(target: FolderTarget) {
	emit('navigate', target.folder ?? null);
}
</script>

<template>
	<div class="flow-folder-navigation">
		<div class="header">
			<span class="title">{{ t('folders') }}</span>
			<AddFolder type="flows" :disabled="actionsDisabled" @created="emit('navigate', $event)" />
		</div>

		<FilesNavigation
			type="flows"
			:root-label="t('all_flows')"
			:show-special-folders="false"
			:show-download="false"
			:current-folder="currentFolder"
			:actions-disabled="actionsDisabled"
			:custom-target-handler="onTarget"
			:delete-config="deleteConfig"
			:delete-content-label="t('delete_flow_folder_dialog.delete_content')"
			:deleted-handler="(parent) => emit('navigate', parent)"
		/>
	</div>
</template>

<style scoped>
.flow-folder-navigation {
	block-size: 100%;
	overflow-y: auto;
	padding: 0 0.75rem;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	block-size: 3.75rem;
}

.title {
	color: var(--theme--foreground-subdued);
	font-weight: 600;
}
</style>
