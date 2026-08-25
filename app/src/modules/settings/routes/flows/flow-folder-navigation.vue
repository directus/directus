<script setup lang="ts">
import { FolderTarget } from '@/types/folders';
import type { DeleteFolderConfig } from '@/utils/delete-folder';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import FilesNavigation from '@/views/private/components/files-navigation.vue';

defineProps<{
	currentFolder?: string;
	actionsDisabled?: boolean;
	updateDisabled?: boolean;
	deleteDisabled?: boolean;
	collapsed?: boolean;
}>();

const emit = defineEmits<{
	navigate: [folderId: string | null];
	deleted: [parent: string | null];
	toggle: [];
}>();

// Flow folders never delete their contained flows — a deleted folder drops its flows back to root
const deleteConfig: DeleteFolderConfig = { collection: 'flows', field: 'folder', onDeleteContents: 'detach' };

function onTarget(target: FolderTarget) {
	emit('navigate', target.folder ?? null);
}
</script>

<template>
	<div class="flow-folder-navigation" :class="{ collapsed }">
		<div class="header" :class="{ collapsed }">
			<span v-if="!collapsed" class="title">{{ $t('folders') }}</span>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="collapsed ? $t('folders') : undefined"
				:icon="collapsed ? 'left_panel_open' : 'left_panel_close'"
				variant="ghost"
				@click="emit('toggle')"
			/>
		</div>

		<FilesNavigation
			v-show="!collapsed"
			type="flows"
			:root-label="$t('all_flows')"
			:show-special-folders="false"
			:show-download="false"
			:current-folder="currentFolder"
			:actions-disabled="actionsDisabled"
			:update-disabled="updateDisabled"
			:delete-disabled="deleteDisabled"
			:custom-target-handler="onTarget"
			:delete-config="deleteConfig"
			:delete-content-label="$t('delete_flow_folder_dialog.delete_content')"
			:deleted-handler="(parent) => emit('deleted', parent)"
		/>
	</div>
</template>

<style scoped>
.flow-folder-navigation {
	/* Match the file library's folder icon colors, which come from the shell navigation */
	--v-list-item-icon-color: var(--theme--navigation--list--icon--foreground);
	--v-list-item-icon-color-hover: var(--theme--navigation--list--icon--foreground-hover);
	--v-list-item-icon-color-active: var(--theme--navigation--list--icon--foreground-active);

	block-size: 100%;
	overflow: hidden;
	background-color: var(--theme--background);
}

.flow-folder-navigation:not(.collapsed) {
	overflow-y: auto;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.25rem;
	block-size: 3.75rem;
}

.header:not(.collapsed) {
	padding-inline: 0.75rem;
}

.header.collapsed {
	justify-content: center;
}

.flow-folder-navigation :deep(.nav) {
	--v-list-padding: 0.75rem;
}

.title {
	flex-grow: 1;
	color: var(--theme--foreground);
	font-weight: 600;
}
</style>
