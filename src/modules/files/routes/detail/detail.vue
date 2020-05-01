<template>
	<private-view :title="loading ? $t('loading') : $t('editing_file', { title: item.title })">
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

			<v-button
				v-if="item && item.type.includes('image')"
				rounded
				icon
				@click="editActive = true"
				class="edit"
			>
				<v-icon name="tune" />
			</v-button>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false"
				@click="saveAndQuit"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						:disabled="hasEdits === false"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<files-navigation />
		</template>

		<div class="file-detail">
			<file-preview
				v-if="isBatch === false && item && item.data"
				:src="`${item.data.full_url}?cache-buster=${cacheBuster}`"
				:mime="item.type"
				:width="item.width"
				:height="item.height"
				:title="item.title"
				@click="previewActive = true"
			/>

			<file-lightbox :id="item.id" v-model="previewActive" />

			<image-editor
				v-if="item && item.type.startsWith('image')"
				:id="item.id"
				@refresh="changeCacheBuster"
				v-model="editActive"
			/>

			<v-form
				:loading="loading"
				:initial-values="item"
				collection="directus_files"
				:batch-mode="isBatch"
				v-model="edits"
			/>
		</div>

		<template #drawer>
			<activity-drawer-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_files"
				:primary-key="primaryKey"
			/>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import FilesNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import router from '@/router';
import ActivityDrawerDetail from '@/views/private/components/activity-drawer-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import FilePreview from '@/views/private/components/file-preview';
import ImageEditor from '@/views/private/components/image-editor';
import { nanoid } from 'nanoid';
import FileLightbox from '@/views/private/components/file-lightbox';

type Values = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	name: 'files-detail',
	components: {
		FilesNavigation,
		ActivityDrawerDetail,
		SaveOptions,
		FilePreview,
		ImageEditor,
		FileLightbox,
	},
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);
		const { primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();

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
		} = useItem(ref('directus_files'), primaryKey);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const confirmDelete = ref(false);

		const cacheBuster = ref(nanoid());

		const editActive = ref(false);

		const previewActive = ref(false);

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
			saveAndAddNew,
			saveAsCopyAndNavigate,
			isBatch,
			changeCacheBuster,
			cacheBuster,
			editActive,
			previewActive,
		};

		function changeCacheBuster() {
			cacheBuster.value = nanoid();
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.t('files'),
					to: `/${currentProjectKey.value}/files/`,
				},
			]);

			return { breadcrumb };
		}

		async function saveAndQuit() {
			await save();
			router.push(`/${currentProjectKey.value}/files`);
		}

		async function saveAndStay() {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const savedItem: Record<string, any> = await save();

			if (props.primaryKey === '+') {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const newPrimaryKey = savedItem.id;
				router.replace(`/${currentProjectKey.value}/collections/files/${newPrimaryKey}`);
			}
		}

		async function saveAndAddNew() {
			await save();
			router.push(`/${currentProjectKey.value}/files/+`);
		}

		async function saveAsCopyAndNavigate() {
			const newPrimaryKey = await saveAsCopy();
			router.push(`/${currentProjectKey.value}/files/${newPrimaryKey}`);
		}

		async function deleteAndQuit() {
			await remove();
			router.push(`/${currentProjectKey.value}/files`);
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

.edit {
	--v-button-background-color: var(--primary-25);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-50);
	--v-button-color-hover: var(--primary);
}

.file-detail {
	padding: var(--content-padding);
}
</style>
