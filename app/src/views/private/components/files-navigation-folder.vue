<script setup lang="ts">
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { Folder, useFolders } from '@/composables/use-folders';
import { FolderTarget } from '@/types/folders';
import { getFolderUrl } from '@/utils/get-asset-url';
import { unexpectedError } from '@/utils/unexpected-error';
import NavigationFolder from '@/views/private/components/files-navigation-folder.vue';
import FolderPicker from '@/views/private/components/folder-picker.vue';
import { getDateTimeFormatted } from '@directus/utils';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const props = withDefaults(
	defineProps<{
		folder: Folder;
		currentFolder?: string;
		actionsDisabled?: boolean;
		clickHandler?: (target: FolderTarget) => void;
	}>(),
	{
		clickHandler: () => () => undefined,
	},
);

const router = useRouter();

const { renameActive, renameValue, renameSave, renameSaving } = useRenameFolder();
const { moveActive, moveValue, moveSave, moveSaving } = useMoveFolder();
const { deleteActive, deleteSave, deleteSaving } = useDeleteFolder();

const { fetchFolders } = useFolders();

function useRenameFolder() {
	const renameActive = ref(false);
	const renameValue = ref(props.folder.name);
	const renameSaving = ref(false);

	return { renameActive, renameValue, renameSave, renameSaving };

	async function renameSave() {
		if (renameValue.value === null || renameSaving.value) return;

		renameSaving.value = true;

		try {
			await api.patch(`/folders/${props.folder.id}`, {
				name: renameValue.value,
			});
		} catch (error) {
			unexpectedError(error);
		} finally {
			renameSaving.value = false;
			await fetchFolders();
			renameActive.value = false;
		}
	}
}

function useMoveFolder() {
	const moveActive = ref(false);
	const moveValue = ref(props.folder.parent);
	const moveSaving = ref(false);

	return { moveActive, moveValue, moveSave, moveSaving };

	async function moveSave() {
		if (moveSaving.value) return;

		moveSaving.value = true;

		try {
			await api.patch(`/folders/${props.folder.id}`, {
				parent: moveValue.value,
			});
		} catch (error) {
			unexpectedError(error);
		} finally {
			moveSaving.value = false;
			await fetchFolders();
			moveActive.value = false;
		}
	}
}

function useDeleteFolder() {
	const deleteActive = ref(false);
	const deleteSaving = ref(false);

	return { deleteActive, deleteSave, deleteSaving };

	async function deleteSave() {
		if (deleteSaving.value) return;

		deleteSaving.value = true;

		try {
			const foldersToUpdate = await api.get('/folders', {
				params: {
					filter: {
						parent: {
							_eq: props.folder.id,
						},
					},
					fields: ['id'],
				},
			});

			const filesToUpdate = await api.get('/files', {
				params: {
					filter: {
						folder: {
							_eq: props.folder.id,
						},
					},
					fields: ['id'],
				},
			});

			const newParent = props.folder.parent || null;

			const folderKeys = foldersToUpdate.data.data.map((folder: { id: string }) => folder.id);
			const fileKeys = filesToUpdate.data.data.map((file: { id: string }) => file.id);

			if (folderKeys.length > 0) {
				await api.patch(`/folders`, {
					keys: folderKeys,
					data: {
						parent: newParent,
					},
				});
			}

			if (fileKeys.length > 0) {
				await api.patch(`/files`, {
					keys: fileKeys,
					data: {
						folder: newParent,
					},
				});
			}

			await api.delete(`/folders/${props.folder.id}`);

			if (newParent) {
				router.replace(`/files/folders/${newParent}`);
			} else {
				router.replace('/files');
			}

			deleteActive.value = false;
		} catch (error) {
			unexpectedError(error);
		} finally {
			await fetchFolders();
			deleteSaving.value = false;
		}
	}
}

async function downloadFolder() {
	const response = await fetch(getFolderUrl(props.folder.id), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		unexpectedError({ response: { data: await response.json() } });
	}

	const blob = await response.blob();
	const filename = response.headers.get('Content-Disposition')?.match(/filename="(.*?)"/)?.[1];

	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename ?? `folder-unknown-${getDateTimeFormatted()}.zip`;
	a.click();
	URL.revokeObjectURL(url);
}
</script>

<template>
	<div>
		<VListItem
			v-if="folder.children === undefined"
			v-context-menu="!actionsDisabled ? 'contextMenu' : null"
			clickable
			:active="currentFolder === folder.id"
			@click="clickHandler({ folder: folder.id })"
		>
			<VListItemIcon><VIcon name="folder" /></VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="folder.name" />
			</VListItemContent>
		</VListItem>

		<VListGroup
			v-else
			v-context-menu="!actionsDisabled ? 'contextMenu' : null"
			clickable
			:active="currentFolder === folder.id"
			:value="folder.id"
			scope="files-navigation"
			disable-groupable-parent
			@click="clickHandler({ folder: folder.id })"
		>
			<template #activator>
				<VListItemIcon>
					<VIcon name="folder" />
				</VListItemIcon>
				<VListItemContent>
					<VTextOverflow :text="folder.name" />
				</VListItemContent>
			</template>

			<NavigationFolder
				v-for="childFolder in folder.children"
				:key="childFolder.id"
				:folder="childFolder"
				:current-folder="currentFolder"
				:click-handler="clickHandler"
				:actions-disabled="actionsDisabled"
			/>
		</VListGroup>

		<VMenu ref="contextMenu" show-arrow placement="bottom-start">
			<VList>
				<VListItem clickable @click="renameActive = true">
					<VListItemIcon>
						<VIcon name="edit" outline />
					</VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t('rename_folder')" />
					</VListItemContent>
				</VListItem>
				<VListItem clickable @click="moveActive = true">
					<VListItemIcon>
						<VIcon name="folder_move" />
					</VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t('move_to_folder')" />
					</VListItemContent>
				</VListItem>
				<VListItem clickable @click="downloadFolder">
					<VListItemIcon>
						<VIcon name="download" />
					</VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t('download_folder')" />
					</VListItemContent>
				</VListItem>
				<VListItem class="danger" clickable @click="deleteActive = true">
					<VListItemIcon>
						<VIcon name="delete" outline />
					</VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t('delete_folder')" />
					</VListItemContent>
				</VListItem>
			</VList>
		</VMenu>

		<VDialog v-model="renameActive" persistent @esc="renameActive = false" @apply="renameSave">
			<VCard>
				<VCardTitle>{{ $t('rename_folder') }}</VCardTitle>
				<VCardText>
					<VInput v-model="renameValue" autofocus />
				</VCardText>
				<VCardActions>
					<VButton secondary @click="renameActive = false">{{ $t('cancel') }}</VButton>
					<VButton :disabled="renameValue === null" :loading="renameSaving" @click="renameSave">
						{{ $t('save') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="moveActive" persistent @esc="moveActive = false" @apply="moveSave">
			<VCard>
				<VCardTitle>{{ $t('move_to_folder') }}</VCardTitle>
				<VCardText>
					<FolderPicker v-model="moveValue" :disabled-folders="[folder.id]" />
				</VCardText>
				<VCardActions>
					<VButton secondary @click="moveActive = false">{{ $t('cancel') }}</VButton>
					<VButton :loading="moveSaving" @click="moveSave">{{ $t('save') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="deleteActive" persistent @esc="deleteActive = false" @apply="deleteSave">
			<VCard>
				<VCardTitle>{{ $t('delete_folder') }}</VCardTitle>
				<VCardText>
					<VNotice>
						{{ $t('nested_files_folders_will_be_moved') }}
					</VNotice>
				</VCardText>
				<VCardActions>
					<VButton secondary @click="deleteActive = false">{{ $t('cancel') }}</VButton>
					<VButton kind="danger" :loading="deleteSaving" @click="deleteSave">{{ $t('delete_label') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style scoped>
.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}
</style>
