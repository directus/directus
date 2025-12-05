<script setup lang="ts">
import api from '@/api';
import { useEventListener } from '@/composables/use-event-listener';
import { useExtension } from '@/composables/use-extension';
import { Folder, useFolders } from '@/composables/use-folders';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { usePreset } from '@/composables/use-preset';
import { emitter, Events } from '@/events';
import { useFilesStore } from '@/stores/files.js';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { getAssetUrl, getFilesUrl } from '@/utils/get-asset-url';
import { getFolderFilter } from '@/utils/get-folder-filter';
import { unexpectedError } from '@/utils/unexpected-error';
import { uploadFiles } from '@/utils/upload-files';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import FilesNavigation from '@/views/private/components/files-navigation.vue';
import FolderPicker from '@/views/private/components/folder-picker.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { useLayout } from '@directus/composables';
import { getDateFormatted, mergeFilters } from '@directus/utils';
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router';
import AddFolder from '../components/add-folder.vue';

const props = defineProps<{
	folder?: string;
	special?: 'all' | 'recent' | 'mine';
}>();

const { t } = useI18n();

const router = useRouter();

const notificationsStore = useNotificationsStore();
const { folders } = useFolders();

const layoutRef = ref();
const selection = ref<string[]>([]);

const userStore = useUserStore();

const { layout, layoutOptions, layoutQuery, filter, search, resetPreset } = usePreset(ref('directus_files'));

const currentLayout = useExtension('layout', layout);

const { confirmDelete, deleting, batchDelete, batchEditActive } = useBatch();

const { breadcrumb, title } = useBreadcrumb();

const folderFilter = computed(() => {
	return getFolderFilter(props.folder, props.special, userStore?.currentUser?.id);
});

const { layoutWrapper } = useLayout(layout);

const { moveToDialogActive, moveToFolder, moving, selectedFolder } = useMovetoFolder();

onBeforeRouteLeave(() => {
	selection.value = [];
});

onBeforeRouteUpdate(() => {
	selection.value = [];
});

const { isAnyUploadActive, onDragEnter, onDragLeave, onDrop, onDragOver, showDropEffect, dragging } = useFileUpload();

useEventListener(window, 'dragenter', onDragEnter);
useEventListener(window, 'dragover', onDragOver);
useEventListener(window, 'dragleave', onDragLeave);
useEventListener(window, 'drop', onDrop);

watch(isAnyUploadActive, (isUploading, wasUploading) => {
	if (wasUploading && !isUploading) {
		refresh();
	}
});

const {
	updateAllowed: batchEditAllowed,
	deleteAllowed: batchDeleteAllowed,
	createAllowed,
} = useCollectionPermissions('directus_files');

const { createAllowed: createFolderAllowed } = useCollectionPermissions('directus_folders');

function useBatch() {
	const confirmDelete = ref(false);
	const deleting = ref(false);

	const batchEditActive = ref(false);

	const error = ref<any>();

	return { batchEditActive, confirmDelete, deleting, batchDelete, error };

	async function batchDelete() {
		if (deleting.value) return;

		deleting.value = true;

		const batchPrimaryKeys = selection.value;

		try {
			await api.delete('/files', {
				data: batchPrimaryKeys,
			});

			await refresh();

			selection.value = [];
		} catch (e) {
			unexpectedError(e);
			error.value = e;
		} finally {
			confirmDelete.value = false;
			deleting.value = false;
		}
	}
}

function useBreadcrumb() {
	const title = computed(() => {
		if (props.special === 'all') {
			return t('all_files');
		}

		if (props.special === 'mine') {
			return t('my_files');
		}

		if (props.special === 'recent') {
			return t('recent_files');
		}

		if (props.folder) {
			const folder = folders.value?.find((folder: Folder) => folder.id === props.folder);

			if (folder) {
				return folder.name;
			}
		}

		return t('file_library');
	});

	const breadcrumb = computed(() => {
		if (title.value !== t('file_library')) {
			return [
				{
					name: t('file_library'),
					to: `/files`,
				},
			];
		}

		return null;
	});

	return { breadcrumb, title };
}

function useMovetoFolder() {
	const moveToDialogActive = ref(false);
	const moving = ref(false);
	const selectedFolder = ref<string | null>(null);

	return { moveToDialogActive, moving, moveToFolder, selectedFolder };

	async function moveToFolder() {
		if (moving.value) return;

		moving.value = true;

		try {
			await api.patch(`/files`, {
				keys: selection.value,
				data: {
					folder: selectedFolder.value,
				},
			});

			selection.value = [];

			if (selectedFolder.value) {
				router.push(`/files/folders/${selectedFolder.value}`);
			}

			await nextTick();
			await refresh();
		} catch (error) {
			unexpectedError(error);
		} finally {
			moveToDialogActive.value = false;
			moving.value = false;
		}
	}
}

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

function clearFilters() {
	filter.value = null;
	search.value = null;
}

function useFileUpload() {
	const filesStore = useFilesStore();
	const { isAnyUploadActive } = storeToRefs(filesStore);
	const newUpload = filesStore.upload();

	const showDropEffect = ref(false);

	let dragNotificationID: string;
	let fileUploadNotificationID: string;

	const dragCounter = ref(0);

	const dragging = computed(() => dragCounter.value > 0);

	return { isAnyUploadActive, onDragEnter, onDragLeave, onDrop, onDragOver, showDropEffect, dragging };

	function enableDropEffect() {
		showDropEffect.value = true;

		dragNotificationID = notificationsStore.add({
			title: t('drop_to_upload'),
			icon: 'cloud_upload',
			type: 'info',
			persist: true,
			closeable: false,
		});
	}

	function disableDropEffect() {
		showDropEffect.value = false;

		if (dragNotificationID) {
			notificationsStore.remove(dragNotificationID);
		}
	}

	function onDragEnter(event: DragEvent) {
		if (!event.dataTransfer) return;
		if (event.dataTransfer?.types.indexOf('Files') === -1) return;

		event.preventDefault();
		dragCounter.value++;

		const isDropzone = event.target && (event.target as HTMLElement).getAttribute?.('data-dropzone') === '';

		if (dragCounter.value === 1 && showDropEffect.value === false && isDropzone === false) {
			enableDropEffect();
		}

		if (isDropzone) {
			disableDropEffect();
			dragCounter.value = 0;
		}
	}

	function onDragOver(event: DragEvent) {
		if (!event.dataTransfer) return;
		if (event.dataTransfer?.types.indexOf('Files') === -1) return;

		event.preventDefault();
	}

	function onDragLeave(event: DragEvent) {
		if (!event.dataTransfer) return;
		if (event.dataTransfer?.types.indexOf('Files') === -1) return;

		event.preventDefault();
		dragCounter.value--;

		if (dragCounter.value === 0) {
			disableDropEffect();
		}

		if (event.target && (event.target as HTMLElement).getAttribute?.('data-dropzone') === '') {
			enableDropEffect();
			dragCounter.value = 1;
		}
	}

	async function onDrop(event: DragEvent) {
		if (!event.dataTransfer) return;
		if (event.dataTransfer?.types.indexOf('Files') === -1) return;

		event.preventDefault();
		showDropEffect.value = false;

		dragCounter.value = 0;

		if (dragNotificationID) {
			notificationsStore.remove(dragNotificationID);
		}

		const files = Array.from(event.dataTransfer.files).filter((file) => file.type);

		fileUploadNotificationID = notificationsStore.add({
			title: t(
				'upload_files_indeterminate',
				{
					done: 0,
					total: files.length,
				},
				files.length,
			),
			type: 'info',
			persist: true,
			closeable: false,
			loading: true,
		});

		const preset = props.folder ? { folder: props.folder } : undefined;

		try {
			newUpload.start(files.length);

			await uploadFiles(files, {
				preset,
				onProgressChange: (progress) => {
					const percentageDone = progress.reduce((val, cur) => (val += cur)) / progress.length;

					const total = files.length;
					const done = progress.filter((p) => p === 100).length;

					notificationsStore.update(fileUploadNotificationID, {
						title: t(
							'upload_files_indeterminate',
							{
								done,
								total,
							},
							files.length,
						),
						loading: false,
						progress: percentageDone,
					});
				},
			});
		} finally {
			newUpload.finish();
		}

		notificationsStore.remove(fileUploadNotificationID);
		emitter.emit(Events.upload);
	}
}

async function downloadFiles() {
	let response;

	if (selection.value.length === 1) {
		response = await fetch(getAssetUrl(selection.value[0]!));
	} else {
		response = await fetch(getFilesUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ ids: selection.value }),
		});
	}

	const blob = await response.blob();
	const filename = response.headers.get('Content-Disposition')?.match(/filename="(.*?)"/)?.[1];

	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename ?? `files-${getDateFormatted()}.zip`;
	a.click();
}
</script>

<template>
	<component
		:is="layoutWrapper"
		ref="layoutRef"
		v-slot="{ layoutState }"
		v-model:selection="selection"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter="mergeFilters(filter, folderFilter)"
		:filter-user="filter"
		:filter-system="folderFilter"
		:search="search"
		collection="directus_files"
		:reset-preset="resetPreset"
	>
		<private-view
			:title="title"
			:class="{ dragging }"
			:small-header="currentLayout?.smallHeader"
			:header-shadow="currentLayout?.headerShadow"
		>
			<template v-if="breadcrumb" #headline>
				<v-breadcrumb :items="breadcrumb" />
			</template>

			<template #title-outer:prepend>
				<v-button class="header-icon" rounded disabled icon secondary>
					<v-icon name="folder" outline />
				</v-button>
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<search-input v-model="search" v-model:filter="filter" collection="directus_files" />

				<add-folder :parent="folder" :disabled="createFolderAllowed !== true" />

				<v-dialog
					v-if="selection.length > 0"
					v-model="moveToDialogActive"
					@esc="moveToDialogActive = false"
					@apply="moveToFolder"
				>
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="batchEditAllowed ? $t('move_to_folder') : $t('not_allowed')"
							rounded
							icon
							class="folder"
							secondary
							:disabled="!batchEditAllowed"
							@click="on"
						>
							<v-icon name="folder_move" />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ $t('move_to_folder') }}</v-card-title>

						<v-card-text>
							<folder-picker v-model="selectedFolder" />
						</v-card-text>

						<v-card-actions>
							<v-button secondary @click="moveToDialogActive = false">
								{{ $t('cancel') }}
							</v-button>
							<v-button :loading="moving" @click="moveToFolder">
								{{ $t('move') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="batchDeleteAllowed ? $t('delete_label') : $t('not_allowed')"
							:disabled="batchDeleteAllowed !== true"
							rounded
							icon
							class="action-delete"
							secondary
							@click="on"
						>
							<v-icon name="delete" outline />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ $t('batch_delete_confirm', selection.length) }}</v-card-title>

						<v-card-actions>
							<v-button secondary @click="confirmDelete = false">
								{{ $t('cancel') }}
							</v-button>
							<v-button kind="danger" :loading="deleting" @click="batchDelete">
								{{ $t('delete_label') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-button
					v-if="selection.length > 0"
					v-tooltip.bottom="batchEditAllowed ? $t('edit') : $t('not_allowed')"
					rounded
					icon
					secondary
					:disabled="batchEditAllowed === false"
					@click="batchEditActive = true"
				>
					<v-icon name="edit" outline />
				</v-button>

				<v-button
					v-if="selection.length > 0"
					v-tooltip.bottom="$t('download')"
					rounded
					icon
					secondary
					download
					@click="downloadFiles"
				>
					<v-icon name="download" outline />
				</v-button>

				<v-button
					v-tooltip.bottom="createAllowed ? $t('upload_file') : $t('not_allowed')"
					rounded
					icon
					:to="folder ? { path: `/files/folders/${folder}/+` } : { path: '/files/+' }"
					:disabled="createAllowed === false"
				>
					<v-icon name="add" />
				</v-button>
			</template>

			<template #navigation>
				<files-navigation :current-folder="folder" :current-special="special" />
			</template>

			<component :is="`layout-${layout}`" v-bind="layoutState">
				<template #no-results>
					<v-info v-if="!filter && !search" :title="$t('file_count', 0)" icon="folder" center>
						{{ $t('no_files_copy') }}

						<template #append>
							<v-button :to="folder ? { path: `/files/folders/${folder}/+` } : { path: '/files/+' }">
								{{ $t('add_file') }}
							</v-button>
						</template>
					</v-info>

					<v-info v-else :title="$t('no_results')" icon="search" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<v-button @click="clearFilters">{{ $t('clear_filters') }}</v-button>
						</template>
					</v-info>
				</template>

				<template #no-items>
					<v-info :title="$t('file_count', 0)" icon="folder" center>
						{{ $t('no_files_copy') }}

						<template #append>
							<v-button
								v-tooltip.bottom="createAllowed ? $t('add_file') : $t('not_allowed')"
								:disabled="createAllowed === false"
								:to="folder ? { path: `/files/folders/${folder}/+` } : { path: '/files/+' }"
							>
								{{ $t('add_file') }}
							</v-button>
						</template>
					</v-info>
				</template>
			</component>

			<router-view name="addNew" :folder="folder" @upload="refresh" />

			<drawer-batch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				collection="directus_files"
				@refresh="refresh"
			/>

			<template #sidebar>
				<sidebar-detail icon="info" :title="$t('information')" close>
					<div v-md="$t('page_help_files_collection')" class="page-description" />
				</sidebar-detail>
				<layout-sidebar-detail v-model="layout">
					<component :is="`layout-options-${layout}`" v-bind="layoutState" />
				</layout-sidebar-detail>
				<component :is="`layout-sidebar-${layout}`" v-bind="layoutState" />
				<export-sidebar-detail
					collection="directus_files"
					:layout-query="layoutQuery"
					:filter="mergeFilters(filter, folderFilter)"
					:search="search"
					@refresh="refresh"
				/>
			</template>

			<template v-if="showDropEffect">
				<div class="drop-border top" />
				<div class="drop-border right" />
				<div class="drop-border bottom" />
				<div class="drop-border left" />
			</template>
		</private-view>
	</component>
</template>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}

.drop-border {
	position: fixed;
	z-index: 500;
	background-color: var(--theme--primary);

	&.top,
	&.bottom {
		inline-size: 100%;
		block-size: 4px;
	}

	&.left,
	&.right {
		inline-size: 4px;
		block-size: 100%;
	}

	&.top {
		inset-block-start: 0;
		inset-inline-start: 0;
	}

	&.right {
		inset-block-start: 0;
		inset-inline-end: 0;
	}

	&.bottom {
		inset-block-end: 0;
		inset-inline-start: 0;
	}

	&.left {
		inset-block-start: 0;
		inset-inline-start: 0;
	}
}

.dragging {
	:deep(*) {
		pointer-events: none;
	}

	:deep([data-dropzone]) {
		pointer-events: all;
	}
}
</style>
