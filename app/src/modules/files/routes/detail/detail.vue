<template>
	<files-not-found v-if="!loading && !item" />
	<private-view v-else :title="loading || !item ? $t('loading') : item.title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary exact :to="breadcrumb[0].to">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						:disabled="item === null"
						@click="on"
						v-tooltip.bottom="$t('delete')"
					>
						<v-icon name="delete" />
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

			<v-dialog v-model="moveToDialogActive" v-if="isNew === false">
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
				:disabled="hasEdits === false"
				@click="saveAndQuit"
				v-tooltip.bottom="$t('save')"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						:disabled="hasEdits === false"
						@save-and-stay="saveAndStay"
						@save-as-copy="saveAsCopyAndNavigate"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<files-navigation :current-folder="item && item.folder" />
		</template>

		<div class="file-detail">
			<file-preview
				v-if="isBatch === false && item"
				:src="fileSrc"
				:mime="item.type"
				:width="item.width"
				:height="item.height"
				:title="item.title"
				@click="previewActive = true"
			/>

			<file-lightbox v-if="item" :id="item.id" v-model="previewActive" />

			<image-editor
				v-if="item && item.type.startsWith('image')"
				:id="item.id"
				@refresh="changeCacheBuster"
				v-model="editActive"
			/>

			<v-form
				:fields="formFields"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				:primary-key="primaryKey"
				v-model="edits"
			/>
		</div>

		<v-dialog v-model="confirmLeave">
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

		<template #drawer>
			<file-info-drawer-detail :file="item" @move-folder="moveToDialogActive = true" />
			<revisions-drawer-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_files"
				:primary-key="primaryKey"
				ref="revisionsDrawerDetail"
			/>
			<comments-drawer-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_files"
				:primary-key="primaryKey"
			/>
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_files_detail'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref, watch } from '@vue/composition-api';
import FilesNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import router from '@/router';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail';
import CommentsDrawerDetail from '@/views/private/components/comments-drawer-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import FilePreview from '@/views/private/components/file-preview';
import ImageEditor from '@/views/private/components/image-editor';
import { nanoid } from 'nanoid';
import FileLightbox from '@/views/private/components/file-lightbox';
import { useFieldsStore } from '@/stores/';
import { Field } from '@/types';
import FileInfoDrawerDetail from './components/file-info-drawer-detail.vue';
import marked from 'marked';
import useFormFields from '@/composables/use-form-fields';
import FolderPicker from '../../components/folder-picker';
import api from '@/api';
import getRootPath from '@/utils/get-root-path';
import FilesNotFound from '../not-found/';
import useShortcut from '@/composables/use-shortcut';

type Values = {
	[field: string]: any;
};

export default defineComponent({
	name: 'files-detail',
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
		CommentsDrawerDetail,
		SaveOptions,
		FilePreview,
		ImageEditor,
		FileLightbox,
		FileInfoDrawerDetail,
		FolderPicker,
		FilesNotFound,
	},
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();
		const fieldsStore = useFieldsStore();

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
		} = useItem(ref('directus_files'), primaryKey);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);
		const confirmDelete = ref(false);
		const cacheBuster = ref(nanoid());
		const editActive = ref(false);
		const previewActive = ref(false);
		const fileSrc = computed(() => {
			return (
				getRootPath() + `assets/${props.primaryKey}?cache-buster=${cacheBuster.value}&key=system-large-contain`
			);
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
			'duration',
			'folder',
			'charset',
			'embed',
		];

		const fieldsFiltered = computed(() => {
			return fieldsStore
				.getFieldsForCollection('directus_files')
				.filter((field: Field) => fieldsDenyList.includes(field.field) === false);
		});

		const { formFields } = useFormFields(fieldsFiltered);

		const confirmLeave = ref(false);
		const leaveTo = ref<string | null>(null);

		const { moveToDialogActive, moveToFolder, moving, selectedFolder } = useMovetoFolder();

		useShortcut('mod+s', saveAndStay);

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
			changeCacheBuster,
			cacheBuster,
			editActive,
			previewActive,
			revisionsDrawerDetail,
			formFields,
			marked,
			confirmLeave,
			leaveTo,
			discardAndLeave,
			moveToDialogActive,
			moveToFolder,
			moving,
			selectedFolder,
			fileSrc,
		};

		function changeCacheBuster() {
			cacheBuster.value = nanoid();
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.t('file_library'),
					to: {
						path: `/files/`,
						query: {
							folder: item?.value?.folder,
						},
					},
				},
			]);

			return { breadcrumb };
		}

		async function saveAndQuit() {
			await save();
			router.push(`/files`);
		}

		async function saveAndStay() {
			await save();
			revisionsDrawerDetail.value?.$data?.refresh?.();
		}

		async function saveAsCopyAndNavigate() {
			const newPrimaryKey = await saveAsCopy();
			router.push(`/files/${newPrimaryKey}`);
		}

		async function deleteAndQuit() {
			await remove();
			router.push(`/files`);
		}

		function discardAndLeave() {
			if (!leaveTo.value) return;
			edits.value = {};
			router.push(leaveTo.value);
		}

		function useMovetoFolder() {
			const moveToDialogActive = ref(false);
			const moving = ref(false);
			const selectedFolder = ref<number | null>();

			watch(item, () => {
				selectedFolder.value = item.value.folder;
			});

			return { moveToDialogActive, moving, moveToFolder, selectedFolder };

			async function moveToFolder() {
				moving.value = true;

				try {
					await api.patch(`/files/${props.primaryKey}`, {
						folder: selectedFolder.value,
					});
					await refresh();
				} catch (err) {
					console.error(err);
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
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
}

.edit,
.folder {
	--v-button-background-color: var(--primary-25);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-50);
	--v-button-color-hover: var(--primary);
}

.file-detail {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
