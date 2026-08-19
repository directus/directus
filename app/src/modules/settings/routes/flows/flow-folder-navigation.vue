<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AddFolder from '@/modules/files/components/add-folder.vue';
import { FolderTarget } from '@/types/folders';
import type { DeleteFolderConfig } from '@/utils/delete-folder';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import FilesNavigation from '@/views/private/components/files-navigation.vue';

defineProps<{
	currentFolder?: string;
	actionsDisabled?: boolean;
	collapsed?: boolean;
}>();

const emit = defineEmits<{
	navigate: [folderId: string | null];
	toggle: [];
}>();

const { t } = useI18n();

// Flow folders never delete their contained flows — a deleted folder drops its flows back to root
const deleteConfig: DeleteFolderConfig = { collection: 'flows', field: 'folder', onDeleteContents: 'detach' };

function onTarget(target: FolderTarget) {
	emit('navigate', target.folder ?? null);
}
</script>

<template>
	<div class="flow-folder-navigation" :class="{ collapsed }">
		<div class="header" :class="{ collapsed }">
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="collapsed ? t('folders') : undefined"
				:icon="collapsed ? 'left_panel_open' : 'left_panel_close'"
				variant="ghost"
				@click="emit('toggle')"
			/>

			<template v-if="!collapsed">
				<span class="title">{{ t('folders') }}</span>
				<AddFolder
					type="flows"
					:parent="currentFolder"
					:disabled="actionsDisabled"
					@created="emit('navigate', $event)"
				/>
			</template>
		</div>

		<FilesNavigation
			v-show="!collapsed"
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
	overflow: hidden;
}

.flow-folder-navigation:not(.collapsed) {
	overflow-y: auto;
	padding: 0 0.75rem;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.25rem;
	block-size: 3.75rem;
}

.header.collapsed {
	justify-content: center;
}

.title {
	flex-grow: 1;
	color: var(--theme--foreground-subdued);
	font-weight: 600;
}
</style>
