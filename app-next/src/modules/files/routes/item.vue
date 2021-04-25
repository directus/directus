<template>
	<files-not-found v-if="!loading && !item" />
	<private-view v-else :title="loading || !item ? $t('loading') : item.title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary exact @click="$router.back()">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						:disabled="item === null || deleteAllowed === false"
						@click="on"
						v-tooltip.bottom="deleteAllowed ? $t('delete') : $t('not_allowed')"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteAndQuit" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog v-model="moveToDialogActive" v-if="isNew === false" @esc="moveToDialogActive = false">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						:disabled="item === null"
						@click="on"
						class="folder"
						v-tooltip.bottom="$t('move_to_folder')"
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
						<v-button @click="moveToDialogActive = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="moveToFolder" :loading="moving">
							{{ $t('move') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button rounded icon @click="downloadFile" class="download" v-tooltip.bottom="$t('download')">
				<v-icon name="save_alt" />
			</v-button>

			<v-button
				v-if="item && item.type.includes('image')"
				rounded
				icon
				@click="editActive = true"
				class="edit"
				v-tooltip.bottom="$t('edit')"
			>
				<v-icon name="tune" />
			</v-button>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false || saveAllowed === false"
				@click="saveAndQuit"
				v-tooltip.bottom="saveAllowed ? $t('save') : $t('not_allowed')"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="hasEdits === true || saveAllowed === true"
						@save-and-stay="saveAndStay"
						@save-as-copy="saveAsCopyAndNavigate"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<files-navigation :current-folder="item && item.folder" />
		</template>

		<div class="file-item">
			<file-preview
				v-if="isBatch === false && item"
				:src="fileSrc"
				:mime="item.type"
				:width="item.width"
				:height="item.height"
				:title="item.title"
				@click="replaceFileDialogActive = true"
			/>

			<image-editor
				v-if="item && item.type.startsWith('image')"
				:id="item.id"
				@refresh="refresh"
				v-model="editActive"
			/>

			<v-form
				ref="form"
				:fields="fieldsFiltered"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				:primary-key="primaryKey"
				:disabled="updateAllowed === false"
				:validation-errors="validationErrors"
				v-model="edits"
			/>
		</div>

		<v-dialog v-model="confirmLeave" @esc="discardAndLeave">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ $t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<file-info-sidebar-detail :file="item" />
			<revisions-drawer-detail
				v-if="isBatch === false && isNew === false && revisionsAllowed"
				collection="directus_files"
				:primary-key="primaryKey"
				ref="revisionsDrawerDetail"
			/>
			<comments-sidebar-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_files"
				:primary-key="primaryKey"
			/>
		</template>

		<replace-file v-model="replaceFileDialogActive" @replaced="refresh" :file="item" />
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref, watch } from '@vue/composition-api';
import FilesNavigation from '../components/navigation.vue';
import { i18n } from '@/lang';
import router from '@/router';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import FilePreview from '@/views/private/components/file-preview';
import ImageEditor from '@/views/private/components/image-editor';
import { Field } from '@/types';
import FileInfoSidebarDetail from '../components/file-info-sidebar-detail.vue';
import FolderPicker from '../components/folder-picker.vue';
import api, { addTokenToURL } from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import FilesNotFound from './not-found.vue';
import useShortcut from '@/composables/use-shortcut';
import ReplaceFile from '../components/replace-file.vue';
import { usePermissions } from '@/composables/use-permissions';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import unsavedChanges from '@/composables/unsaved-changes';

export default defineComponent({
	name: 'files-item',
	beforeRouteLeave(to, from, next) {
		const self = this as any;
		const hasEdits = Object.keys(self.edits).length > 0;

		if (hasEdits) {
			self.confirmLeave = true;
			self.leaveTo = to.fullPath;
			return next(false);
		}

		return next();
	},
	components: {
		FilesNavigation,
		RevisionsDrawerDetail,
		CommentsSidebarDetail,
		FilePreview,
		ImageEditor,
		FileInfoSidebarDetail,
		FolderPicker,
		FilesNotFound,
		ReplaceFile,
		SaveOptions,
	},
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const form = ref<HTMLElement>();
		const { primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();
		const replaceFileDialogActive = ref(false);

		const revisionsDrawerDetail = ref<Vue | null>(null);

		const {
			isNew,
			edits,
			item,
			saving,
			loading,
			error,
			save,
			remove,
			deleting,
			saveAsCopy,
			isBatch,
			refresh,
			validationErrors,
		} = useItem(ref('directus_files'), primaryKey);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		unsavedChanges(hasEdits);

		const confirmDelete = ref(false);
		const editActive = ref(false);
		const fileSrc = computed(() => {
			if (item.value && item.value.modified_on) {
				return addTokenToURL(
					getRootPath() + `assets/${props.primaryKey}?cache-buster=${item.value.modified_on}&key=system-large-contain`
				);
			}

			return addTokenToURL(getRootPath() + `assets/${props.primaryKey}?key=system-large-contain`);
		});

		// These are the fields that will be prevented from showing up in the form because they'll be shown in the sidebar
		const fieldsDenyList: string[] = [
			'type',
			'width',
			'height',
			'filesize',
			'checksum',
			'uploaded_by',
			'uploaded_on',
			'modified_by',
			'modified_on',
			'duration',
			'folder',
			'charset',
			'embed',
		];

		const to = computed(() => {
			if (item.value && item.value?.folder) return `/files?folder=${item.value.folder}`;
			else return '/files';
		});

		const confirmLeave = ref(false);
		const leaveTo = ref<string | null>(null);

		const { moveToDialogActive, moveToFolder, moving, selectedFolder } = useMovetoFolder();

		useShortcut('meta+s', saveAndStay, form);

		const { deleteAllowed, saveAllowed, updateAllowed, fields, revisionsAllowed } = usePermissions(
			ref('directus_files'),
			item,
			isNew
		);

		const fieldsFiltered = computed(() => {
			return fields.value.filter((field: Field) => fieldsDenyList.includes(field.field) === false);
		});

		return {
			item,
			loading,
			error,
			isNew,
			breadcrumb,
			edits,
			hasEdits,
			saving,
			saveAndQuit,
			deleteAndQuit,
			confirmDelete,
			deleting,
			saveAndStay,
			saveAsCopyAndNavigate,
			isBatch,
			editActive,
			revisionsDrawerDetail,
			confirmLeave,
			leaveTo,
			discardAndLeave,
			downloadFile,
			moveToDialogActive,
			moveToFolder,
			moving,
			selectedFolder,
			fileSrc,
			form,
			to,
			replaceFileDialogActive,
			refresh,
			deleteAllowed,
			saveAllowed,
			updateAllowed,
			fields,
			fieldsFiltered,
			revisionsAllowed,
			validationErrors,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				if (!item?.value?.folder) {
					return [
						{
							name: i18n.t('file_library'),
							to: '/files',
						},
					];
				}

				return [
					{
						name: i18n.t('file_library'),
						to: {
							path: `/files/`,
							query: {
								folder: item?.value?.folder,
							},
						},
					},
				];
			});

			return { breadcrumb };
		}

		async function saveAndQuit() {
			try {
				await save();
				router.push(to.value);
			} catch {
				// `save` will show unexpected error dialog
			}
		}

		async function saveAndStay() {
			try {
				await save();
				revisionsDrawerDetail.value?.$data?.refresh?.();
			} catch {
				// `save` will show unexpected error dialog
			}
		}

		async function saveAsCopyAndNavigate() {
			const newPrimaryKey = await saveAsCopy();
			if (newPrimaryKey) router.push(`/files/${newPrimaryKey}`);
		}

		async function deleteAndQuit() {
			try {
				await remove();
				router.push(to.value);
			} catch {
				// `remove` will show the unexpected error dialog
			}
		}

		function discardAndLeave() {
			if (!leaveTo.value) return;
			edits.value = {};
			router.push(leaveTo.value);
		}

		function downloadFile() {
			const filePath = addTokenToURL(getRootPath() + `assets/${props.primaryKey}?download`);
			window.open(filePath, '_blank');
		}

		function useMovetoFolder() {
			const moveToDialogActive = ref(false);
			const moving = ref(false);
			const selectedFolder = ref<number | null>();

			watch(item, () => {
				selectedFolder.value = item.value?.folder || null;
			});

			return { moveToDialogActive, moving, moveToFolder, selectedFolder };

			async function moveToFolder() {
				moving.value = true;

				try {
					const response = await api.patch(
						`/files/${props.primaryKey}`,
						{
							folder: selectedFolder.value,
						},
						{
							params: {
								fields: 'folder.name',
							},
						}
					);

					await refresh();
					const folder = response.data.data.folder?.name || i18n.t('file_library');

					notify({
						title: i18n.t('file_moved', { folder }),
						type: 'success',
						icon: 'folder_move',
					});
				} catch (err) {
					unexpectedError(err);
				} finally {
					moveToDialogActive.value = false;
					moving.value = false;
				}
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

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
}

.edit,
.folder,
.download {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}

.file-item {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
