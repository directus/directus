<template>
	<files-not-found v-if="!loading && !item" />
	<private-view v-else :title="loading || !item ? t('loading') : item.title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary exact @click="navigateBack">
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
						v-tooltip.bottom="deleteAllowed ? t('delete_label') : t('not_allowed')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="item === null || deleteAllowed === false"
						@click="on"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog v-if="isNew === false" v-model="moveToDialogActive" @esc="moveToDialogActive = false">
				<template #activator="{ on }">
					<v-button v-tooltip.bottom="t('move_to_folder')" rounded icon :disabled="item === null" secondary @click="on">
						<v-icon name="folder_move" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('move_to_folder') }}</v-card-title>

					<v-card-text>
						<folder-picker v-model="selectedFolder" />
					</v-card-text>

					<v-card-actions>
						<v-button secondary @click="moveToDialogActive = false">
							{{ t('cancel') }}
						</v-button>
						<v-button :loading="moving" @click="moveToFolder">
							{{ t('move') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
			<v-button
				v-tooltip.bottom="t('download')"
				secondary
				icon
				rounded
				:download="item?.filename_download"
				:href="getAssetUrl(props.primaryKey, true)"
			>
				<v-icon name="download" />
			</v-button>

			<v-button
				v-if="item && item.type.includes('image')"
				v-tooltip.bottom="t('edit')"
				rounded
				icon
				secondary
				@click="editActive = true"
			>
				<v-icon name="tune" />
			</v-button>

			<v-button
				v-tooltip.bottom="saveAllowed ? t('save') : t('not_allowed')"
				rounded
				icon
				:loading="saving"
				:disabled="!isSavable"
				@click="saveAndQuit"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="isSavable"
						:disabled-options="createAllowed ? ['save-and-add-new'] : ['save-and-add-new', 'save-as-copy']"
						@save-and-stay="saveAndStay"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<files-navigation :current-folder="item && item.folder" />
		</template>

		<div class="file-item">
			<div v-if="isBatch === false && item" class="preview">
				<file-preview :src="fileSrc" :mime="item.type" :width="item.width" :height="item.height" :title="item.title" />

				<button class="replace-toggle" @click="replaceFileDialogActive = true">
					{{ t('replace_file') }}
				</button>
			</div>

			<image-editor
				v-if="item && item.type.startsWith('image')"
				:id="item.id"
				v-model="editActive"
				@refresh="refresh"
			/>

			<v-form
				ref="form"
				v-model="edits"
				:fields="fieldsFiltered"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				:primary-key="primaryKey"
				:disabled="updateAllowed === false"
				:validation-errors="validationErrors"
			/>
		</div>

		<v-dialog v-model="confirmLeave" @esc="discardAndLeave">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<file-info-sidebar-detail :file="item" />
			<revisions-drawer-detail
				v-if="isBatch === false && isNew === false && revisionsAllowed"
				ref="revisionsDrawerDetailRef"
				collection="directus_files"
				:primary-key="primaryKey"
			/>
			<comments-sidebar-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_files"
				:primary-key="primaryKey"
			/>
		</template>

		<replace-file v-model="replaceFileDialogActive" :file="item" @replaced="refresh" />
	</private-view>
</template>

<script setup lang="ts">
import api from '@/api';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { usePermissions } from '@/composables/use-permissions';
import { useShortcut } from '@/composables/use-shortcut';
import { getAssetUrl } from '@/utils/get-asset-url';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import FilePreview from '@/views/private/components/file-preview.vue';
import FolderPicker from '@/views/private/components/folder-picker.vue';
import ImageEditor from '@/views/private/components/image-editor.vue';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import { Field } from '@directus/types';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import FileInfoSidebarDetail from '../components/file-info-sidebar-detail.vue';
import FilesNavigation from '@/views/private/components/files-navigation.vue';
import ReplaceFile from '../components/replace-file.vue';
import FilesNotFound from './not-found.vue';

interface Props {
	primaryKey: string;
}

const props = defineProps<Props>();

const { t } = useI18n();

const router = useRouter();

const form = ref<HTMLElement>();
const { primaryKey } = toRefs(props);
const { breadcrumb } = useBreadcrumb();
const replaceFileDialogActive = ref(false);

const revisionsDrawerDetailRef = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

const {
	isNew,
	edits,
	hasEdits,
	item,
	saving,
	loading,
	save,
	remove,
	deleting,
	saveAsCopy,
	isBatch,
	refresh,
	validationErrors,
} = useItem(ref('directus_files'), primaryKey);

const isSavable = computed(() => saveAllowed.value && hasEdits.value);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

const confirmDelete = ref(false);
const editActive = ref(false);

const fileSrc = computed(() => {
	if (item.value && item.value.modified_on) {
		return `assets/${props.primaryKey}?cache-buster=${item.value.modified_on}&key=system-large-contain`;
	}

	return `assets/${props.primaryKey}?key=system-large-contain`;
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
	if (item.value && item.value?.folder) return `/files/folders/${item.value.folder}`;
	else return '/files';
});

const { moveToDialogActive, moveToFolder, moving, selectedFolder } = useMovetoFolder();

useShortcut('meta+s', saveAndStay, form);

const { createAllowed, deleteAllowed, saveAllowed, updateAllowed, fields, revisionsAllowed } = usePermissions(
	ref('directus_files'),
	item,
	isNew
);

const fieldsFiltered = computed(() => {
	return fields.value.filter((field: Field) => fieldsDenyList.includes(field.field) === false);
});

function navigateBack() {
	const backState = router.options.history.state.back;

	if (typeof backState !== 'string' || !backState.startsWith('/login')) {
		router.back();
		return;
	}

	if (item?.value?.folder) {
		router.push(`/files/folders/${item.value.folder}`);
	} else {
		router.push('/files');
	}
}

function useBreadcrumb() {
	const breadcrumb = computed(() => {
		if (!item?.value?.folder) {
			return [
				{
					name: t('file_library'),
					to: '/files',
				},
			];
		}

		return [
			{
				name: t('file_library'),
				to: { path: `/files/folders/${item.value.folder}` },
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
		revisionsDrawerDetailRef.value?.refresh?.();
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
		edits.value = {};
		router.replace(to.value);
	} catch {
		// `remove` will show the unexpected error dialog
		confirmDelete.value = false;
	}
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function discardAndStay() {
	edits.value = {};
	confirmLeave.value = false;
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
			const folder = response.data.data.folder?.name || t('file_library');

			notify({
				title: t('file_moved', { folder }),
				icon: 'folder_move',
			});
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			moveToDialogActive.value = false;
			moving.value = false;
		}
	}
}
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
}

.file-item {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.preview {
	margin-bottom: var(--form-vertical-gap);
}

.replace-toggle {
	color: var(--primary);
	cursor: pointer;
	font-weight: 600;
	margin-top: 12px;
}
</style>
