<template>
	<private-view :title="title" :class="{ dragging }">
		<template #headline v-if="breadcrumb">
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="folder" outline />
			</v-button>
		</template>

		<template #actions:prepend>
			<component :is="`layout-actions-${layout}`" />
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />

			<add-folder :parent="folder" :disabled="createFolderAllowed !== true" />

			<v-dialog v-model="moveToDialogActive" v-if="selection.length > 0" @esc="moveToDialogActive = false">
				<template #activator="{ on }">
					<v-button rounded icon @click="on" class="folder" v-tooltip.bottom="t('move_to_folder')">
						<v-icon name="folder_move" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('move_to_folder') }}</v-card-title>

					<v-card-text>
						<folder-picker v-model="selectedFolder" />
					</v-card-text>

					<v-card-actions>
						<v-button @click="moveToDialogActive = false" secondary>
							{{ t('cancel') }}
						</v-button>
						<v-button @click="moveToFolder" :loading="moving">
							{{ t('move') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog v-model="confirmDelete" v-if="selection.length > 0" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						:disabled="batchDeleteAllowed !== true"
						rounded
						icon
						class="action-delete"
						@click="on"
						v-tooltip.bottom="batchDeleteAllowed ? t('delete') : t('not_allowed')"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ t('cancel') }}
						</v-button>
						<v-button @click="batchDelete" class="action-delete" :loading="deleting">
							{{ t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				class="action-batch"
				:disabled="batchEditAllowed === false"
				@click="batchEditActive = true"
				v-if="selection.length > 1"
				v-tooltip.bottom="batchEditAllowed ? t('edit') : t('not_allowed')"
			>
				<v-icon name="edit" outline />
			</v-button>

			<v-button
				rounded
				icon
				class="add-new"
				:to="folder ? { path: `/files/folders/${folder}/+` } : { path: '/files/+' }"
				v-tooltip.bottom="createAllowed ? t('create_item') : t('not_allowed')"
				:disabled="createAllowed === false"
			>
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<files-navigation :current-folder="folder" />
		</template>

		<component class="layout" :is="`layout-${layout}`">
			<template #no-results>
				<v-info :title="t('no_results')" icon="search" center>
					{{ t('no_results_copy') }}

					<template #append>
						<v-button @click="clearFilters">{{ t('clear_filters') }}</v-button>
					</template>
				</v-info>
			</template>

			<template #no-items>
				<v-info :title="t('file_count', 0)" icon="folder" center>
					{{ t('no_files_copy') }}

					<template #append>
						<v-button :to="folder ? { path: `/files/folders/${folder}/+` } : { path: '/files/+' }">
							{{ t('add_file') }}
						</v-button>
					</template>
				</v-info>
			</template>
		</component>

		<router-view name="addNew" :folder="folder" @upload="refresh" />

		<drawer-batch
			:primary-keys="selection"
			v-model:active="batchEditActive"
			collection="directus_files"
			@refresh="refresh"
		/>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div class="page-description" v-html="md(t('page_help_files_collection'))" />
			</sidebar-detail>
			<layout-sidebar-detail v-model="layout" />
			<component :is="`layout-sidebar-${layout}`" />
		</template>

		<template v-if="showDropEffect">
			<div class="drop-border top" />
			<div class="drop-border right" />
			<div class="drop-border bottom" />
			<div class="drop-border left" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref, reactive, PropType, onMounted, onUnmounted, nextTick } from 'vue';
import FilesNavigation from '../components/navigation.vue';
import api from '@/api';
import usePreset from '@/composables/use-preset';
import FilterSidebarDetail from '@/views/private/components/filter-sidebar-detail';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import AddFolder from '../components/add-folder.vue';
import SearchInput from '@/views/private/components/search-input';
import { md } from '@/utils/md';
import FolderPicker from '../components/folder-picker.vue';
import emitter, { Events } from '@/events';
import { useRouter } from 'vue-router';
import { useNotificationsStore, useUserStore, usePermissionsStore } from '@/stores';
import { subDays } from 'date-fns';
import useFolders, { Folder } from '../composables/use-folders';
import useEventListener from '@/composables/use-event-listener';
import { useLayout } from '@/composables/use-layout';
import uploadFiles from '@/utils/upload-files';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerBatch from '@/views/private/components/drawer-batch';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'files-collection',
	components: {
		FilesNavigation,
		FilterSidebarDetail,
		LayoutSidebarDetail,
		AddFolder,
		SearchInput,
		FolderPicker,
		DrawerBatch,
	},
	props: {
		folder: {
			type: String,
			default: null,
		},
		special: {
			type: String as PropType<'all' | 'recent' | 'mine'>,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const notificationsStore = useNotificationsStore();
		const permissionsStore = usePermissionsStore();
		const { folders } = useFolders();
		const selection = ref<Item[]>([]);

		const userStore = useUserStore();

		const { layout, layoutOptions, layoutQuery, filters, searchQuery, resetPreset } = usePreset(ref('directus_files'));

		const { confirmDelete, deleting, batchDelete, error: deleteError, batchEditActive } = useBatch();

		const { breadcrumb, title } = useBreadcrumb();

		const filtersWithFolderAndType = computed(() => {
			const filtersParsed: any[] = [
				{
					locked: true,
					field: 'type',
					operator: 'nnull',
					value: 1,
				},
			];

			if (props.special === null) {
				if (props.folder !== null) {
					filtersParsed.push({
						locked: true,
						operator: 'eq',
						field: 'folder',
						value: props.folder,
					});
				} else {
					filtersParsed.push({
						locked: true,
						operator: 'null',
						field: 'folder',
						value: true,
					});
				}
			}

			if (props.special === 'mine' && userStore.currentUser) {
				filtersParsed.push({
					locked: true,
					operator: 'eq',
					field: 'uploaded_by',
					value: userStore.currentUser.id,
				});
			}

			if (props.special === 'recent') {
				filtersParsed.push({
					locked: true,
					operator: 'gt',
					field: 'uploaded_on',
					value: subDays(new Date(), 5).toISOString(),
				});
			}

			return filtersParsed;
		});

		const layoutFilters = computed<any[]>({
			get() {
				return [...filters.value, ...filtersWithFolderAndType.value];
			},
			set(newFilters) {
				filters.value = newFilters;
			},
		});

		const layoutState = useLayout(
			layout,
			reactive({
				collection: 'directus_files',
				selection,
				layoutOptions,
				layoutQuery,
				filters: layoutFilters,
				searchQuery,
				resetPreset,
				selectMode: false,
				readonly: false,
			})
		);

		const { moveToDialogActive, moveToFolder, moving, selectedFolder } = useMovetoFolder();

		onMounted(() => emitter.on(Events.upload, refresh));
		onUnmounted(() => emitter.off(Events.upload, refresh));

		const { onDragEnter, onDragLeave, onDrop, onDragOver, showDropEffect, dragging } = useFileUpload();

		useEventListener(window, 'dragenter', onDragEnter);
		useEventListener(window, 'dragover', onDragOver);
		useEventListener(window, 'dragleave', onDragLeave);
		useEventListener(window, 'drop', onDrop);

		const { batchEditAllowed, batchDeleteAllowed, createAllowed, createFolderAllowed } = usePermissions();

		return {
			t,
			breadcrumb,
			title,
			filters,
			selection,
			layoutOptions,
			layoutQuery,
			layout,
			filtersWithFolderAndType,
			searchQuery,
			md,
			moveToDialogActive,
			moveToFolder,
			moving,
			selectedFolder,
			refresh,
			clearFilters,
			onDragEnter,
			onDragLeave,
			showDropEffect,
			onDrop,
			dragging,
			batchEditAllowed,
			batchDeleteAllowed,
			createAllowed,
			createFolderAllowed,
			resetPreset,
			confirmDelete,
			deleting,
			batchDelete,
			deleteError,
			batchEditActive,
		};

		function useBatch() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			const batchEditActive = ref(false);

			const error = ref<any>();

			return { batchEditActive, confirmDelete, deleting, batchDelete, error };

			async function batchDelete() {
				deleting.value = true;

				const batchPrimaryKeys = selection.value;

				try {
					await api.delete('/files', {
						data: batchPrimaryKeys,
					});

					await layoutState.value.refresh();

					selection.value = [];
					confirmDelete.value = false;
				} catch (err) {
					error.value = err;
				} finally {
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
			const selectedFolder = ref<number | null>();

			return { moveToDialogActive, moving, moveToFolder, selectedFolder };

			async function moveToFolder() {
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
				} catch (err) {
					unexpectedError(err);
				} finally {
					moveToDialogActive.value = false;
					moving.value = false;
				}
			}
		}

		function refresh() {
			layoutState.value.refresh();
		}

		function clearFilters() {
			filters.value = [];
			searchQuery.value = null;
		}

		function usePermissions() {
			const batchEditAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const updatePermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'update' && permission.collection === 'directus_files'
				);
				return !!updatePermissions;
			});

			const batchDeleteAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const deletePermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'delete' && permission.collection === 'directus_files'
				);
				return !!deletePermissions;
			});

			const createAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const createPermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === 'directus_files'
				);
				return !!createPermissions;
			});

			const createFolderAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const createPermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === 'directus_folders'
				);
				return !!createPermissions;
			});

			return { batchEditAllowed, batchDeleteAllowed, createAllowed, createFolderAllowed };
		}

		function useFileUpload() {
			const showDropEffect = ref(false);

			let dragNotificationID: string;
			let fileUploadNotificationID: string;

			const dragCounter = ref(0);

			const dragging = computed(() => dragCounter.value > 0);

			return { onDragEnter, onDragLeave, onDrop, onDragOver, showDropEffect, dragging };

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

				const files = [...(event.dataTransfer.files as any)];

				fileUploadNotificationID = notificationsStore.add({
					title: t(
						'upload_files_indeterminate',
						{
							done: 0,
							total: files.length,
						},
						files.length
					),
					type: 'info',
					persist: true,
					closeable: false,
					loading: true,
				});

				await uploadFiles(files, {
					preset: props.folder
						? {
								folder: props.folder,
						  }
						: {},
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
								files.length
							),
							loading: false,
							progress: percentageDone,
						});
					},
				});

				notificationsStore.remove(fileUploadNotificationID);
				emitter.emit(Events.upload);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.action-batch {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.folder {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}

.drop-border {
	position: fixed;
	z-index: 500;
	background-color: var(--primary);

	&.top,
	&.bottom {
		width: 100%;
		height: 4px;
	}

	&.left,
	&.right {
		width: 4px;
		height: 100%;
	}

	&.top {
		top: 0;
		left: 0;
	}

	&.right {
		top: 0;
		right: 0;
	}

	&.bottom {
		bottom: 0;
		left: 0;
	}

	&.left {
		top: 0;
		left: 0;
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
