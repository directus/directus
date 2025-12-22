<script setup lang="ts">
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { getAssetUrl } from '@/utils/get-asset-url';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import FilePreviewReplace from '@/views/private/components/file-preview-replace.vue';
import FilesNavigation from '@/views/private/components/files-navigation.vue';
import FolderPicker from '@/views/private/components/folder-picker.vue';
import ImageEditor from '@/views/private/components/image-editor.vue';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import type { Field, File } from '@directus/types';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import FileInfoSidebarDetail from '../components/file-info-sidebar-detail.vue';
import FilesNotFound from './not-found.vue';

const props = defineProps<{
	primaryKey: string;
}>();

const { t } = useI18n();

const router = useRouter();

const form = ref<HTMLElement>();
const { primaryKey } = toRefs(props);
const { breadcrumb } = useBreadcrumb();

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const {
	isNew,
	edits,
	hasEdits,
	item,
	permissions,
	saving,
	loading,
	save,
	remove,
	deleting,
	saveAsCopy,
	refresh,
	validationErrors,
} = useItem<File>(ref('directus_files'), primaryKey);

const {
	collectionPermissions: { createAllowed, revisionsAllowed },
	itemPermissions: { updateAllowed, deleteAllowed, saveAllowed, fields },
} = permissions;

const isSavable = computed(() => saveAllowed.value && hasEdits.value);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

const confirmDelete = ref(false);
const editActive = ref(false);

// These are the fields that will be prevented from showing up in the form because they'll be shown in the sidebar
const fieldsDenyList: string[] = [
	'type',
	'width',
	'height',
	'filesize',
	'created_on',
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

const fieldsFiltered = computed(() => {
	return fields.value.filter((field: Field) => fieldsDenyList.includes(field.field) === false);
});

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
		revisionsSidebarDetailRef.value?.refresh?.();
		refresh();
	} catch {
		// `save` will show unexpected error dialog
	}
}

async function saveAsCopyAndNavigate() {
	const newPrimaryKey = await saveAsCopy();
	if (newPrimaryKey) router.push(`/files/${newPrimaryKey}`);
}

async function deleteAndQuit() {
	if (deleting.value) return;

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
	const selectedFolder = ref<string | null>(null);

	watch(item, () => {
		selectedFolder.value = item.value?.folder || null;
	});

	return { moveToDialogActive, moving, moveToFolder, selectedFolder };

	async function moveToFolder() {
		if (moving.value) return;

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
				},
			);

			refresh();
			const folder = response.data.data.folder?.name || t('file_library');

			notify({
				title: t('file_moved', { folder }),
				icon: 'folder_move',
			});
		} catch (error) {
			unexpectedError(error);
		} finally {
			moveToDialogActive.value = false;
			moving.value = false;
		}
	}
}

function revert(values: Record<string, any>) {
	edits.value = {
		...edits.value,
		...values,
	};
}
</script>

<template>
	<FilesNotFound v-if="!loading && !item" />
	<PrivateView v-else :title="loading || !item ? $t('loading') : item.title" show-back>
		<template #headline>
			<VBreadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<VDialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="deleteAllowed ? $t('delete_label') : $t('not_allowed')"
						class="action-delete"
						:disabled="item === null || deleteAllowed === false"
						icon="delete"
						secondary
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ $t('delete_are_you_sure') }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmDelete = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ $t('delete_label') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<VDialog
				v-if="isNew === false"
				v-model="moveToDialogActive"
				@esc="moveToDialogActive = false"
				@apply="moveToFolder"
			>
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="item === null || !updateAllowed ? $t('not_allowed') : $t('move_to_folder')"
						secondary
						:disabled="item === null || !updateAllowed"
						icon="folder_move"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ $t('move_to_folder') }}</VCardTitle>

					<VCardText>
						<FolderPicker v-model="selectedFolder" />
					</VCardText>

					<VCardActions>
						<VButton secondary @click="moveToDialogActive = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton :loading="moving" @click="moveToFolder">
							{{ $t('move') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('download')"
				secondary
				:download="item?.filename_download"
				:href="getAssetUrl(props.primaryKey, { isDownload: true })"
				icon="download"
			/>

			<PrivateViewHeaderBarActionButton
				v-if="item?.type?.includes('image') && updateAllowed"
				v-tooltip.bottom="$t('edit')"
				secondary
				icon="tune"
				@click="editActive = true"
			/>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="saveAllowed ? $t('save') : $t('not_allowed')"
				:loading="saving"
				:disabled="!isSavable"
				icon="check"
				@click="saveAndQuit"
			>
				<template #append-outer>
					<SaveOptions
						v-if="isSavable"
						:disabled-options="createAllowed ? ['save-and-add-new'] : ['save-and-add-new', 'save-as-copy']"
						@save-and-stay="saveAndStay"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</PrivateViewHeaderBarActionButton>
		</template>

		<template #navigation>
			<FilesNavigation :current-folder="item?.folder ?? undefined" />
		</template>

		<div class="file-item">
			<FilePreviewReplace v-if="item" class="preview" :file="item" @replace="refresh" />

			<ImageEditor v-if="item?.type?.startsWith('image')" :id="item.id" v-model="editActive" @refresh="refresh" />

			<VForm
				ref="form"
				v-model="edits"
				:fields="fieldsFiltered"
				:loading="loading"
				:initial-values="item"
				:primary-key="primaryKey"
				:disabled="updateAllowed === false"
				:validation-errors="validationErrors"
			/>
		</div>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<template #sidebar>
			<FileInfoSidebarDetail :file="item" :is-new="isNew" />
			<RevisionsSidebarDetail
				v-if="isNew === false && revisionsAllowed"
				ref="revisionsSidebarDetailRef"
				collection="directus_files"
				:primary-key="primaryKey"
				@revert="revert"
			/>
			<CommentsSidebarDetail v-if="isNew === false" collection="directus_files" :primary-key="primaryKey" />
		</template>
	</PrivateView>
</template>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon.secondary {
	--v-button-background-color: var(--theme--background-normal);
}

.file-item {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.preview {
	margin-block-end: var(--theme--form--row-gap);
}
</style>
