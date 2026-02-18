<script setup lang="ts">
import { Filter } from '@directus/types';
import { deepMap } from '@directus/utils';
import { render } from 'micromustache';
import { computed, inject, ref, toRef, toRefs } from 'vue';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VRemove from '@/components/v-remove.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import VUpload from '@/components/v-upload.vue';
import { useMimeTypeFilter } from '@/composables/use-mime-type-filter';
import { useRelationM2O } from '@/composables/use-relation-m2o';
import { useRelationPermissionsM2O } from '@/composables/use-relation-permissions';
import { RelationQuerySingle, useRelationSingle } from '@/composables/use-relation-single';
import { getAssetUrl } from '@/utils/get-asset-url';
import { parseFilter } from '@/utils/parse-filter';
import { readableMimeType } from '@/utils/readable-mime-type';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import DrawerFiles from '@/views/private/components/drawer-files.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';

type FileInfo = {
	id: string;
	title: string;
	type: string;
};

const props = withDefaults(
	defineProps<{
		value: string | Record<string, any> | null;
		disabled?: boolean;
		nonEditable?: boolean;
		loading?: boolean;
		folder?: string;
		filter?: Filter;
		collection: string;
		field: string;
		enableCreate?: boolean;
		enableSelect?: boolean;
		allowedMimeTypes?: string[];
	}>(),
	{
		enableCreate: true,
		enableSelect: true,
	},
);

const emit = defineEmits<{
	input: [value: string | Record<string, any> | null];
}>();

const value = computed({
	get: () => props.value,
	set: (value) => {
		emit('input', value);
	},
});

const { mimeTypeFilter, combinedAcceptString } = useMimeTypeFilter(toRef(props, 'allowedMimeTypes'));

const query = ref<RelationQuerySingle>({
	fields: ['id', 'title', 'type', 'filename_download', 'modified_on'],
});

const { collection, field } = toRefs(props);
const { relationInfo } = useRelationM2O(collection, field);

const activeDialog = ref<'upload' | 'choose' | 'url' | null>(null);
const menuOpen = ref(false);

const {
	displayItem: file,
	loading,
	update,
	remove,
} = useRelationSingle(value, query, relationInfo, {
	enabled: computed(() => !props.loading),
});

const { createAllowed } = useRelationPermissionsM2O(relationInfo);

const fileExtension = computed(() => {
	if (file.value === null) return null;
	return readableMimeType(file.value.type, true);
});

const imageThumbnail = computed(() => {
	if (file.value === null || props.value === null) return null;

	if (file.value.type.includes('image') === false) return null;

	if (file.value.type.includes('svg')) {
		return getAssetUrl(file.value.id, {
			cacheBuster: file.value.modified_on,
		});
	}

	return getAssetUrl(file.value.id, {
		imageKey: 'system-small-cover',
		cacheBuster: file.value.modified_on,
	});
});

const imageThumbnailError = ref<any>(null);

const { url, isValidURL, loading: urlLoading, importFromURL } = useURLImport();

const editDrawerActive = ref(false);

const edits = computed(() => {
	if (!props.value || typeof props.value !== 'object') return {};

	return props.value;
});

const values = inject('values', ref<Record<string, unknown>>({}));

const customFilter = computed(() => {
	const filter = parseFilter(
		deepMap(props.filter, (val: unknown) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		}),
	);

	if (!mimeTypeFilter.value) return filter;
	if (!filter) return mimeTypeFilter.value;

	return {
		_and: [filter, mimeTypeFilter.value],
	};
});

const internalDisabled = computed(() => {
	return props.disabled || (props.enableCreate === false && props.enableSelect === false);
});

const interfaceOpen = computed(() => Boolean(activeDialog.value) || menuOpen.value || editDrawerActive.value);

function setSelection(selection: (string | number)[] | null) {
	if (selection![0]) {
		update(selection![0]);
	} else {
		remove();
	}
}

function onUpload(fileInfo: FileInfo) {
	file.value = fileInfo;
	activeDialog.value = null;
	update(fileInfo.id);
}

function useURLImport() {
	const url = ref('');
	const loading = ref(false);

	const isValidURL = computed(() => {
		try {
			new URL(url.value);
			return true;
		} catch {
			return false;
		}
	});

	return { url, loading, isValidURL, importFromURL };

	async function importFromURL() {
		loading.value = true;

		try {
			const response = await api.post(`/files/import`, {
				url: url.value,
				data: {
					folder: props.folder,
				},
				allowedMimeTypes: props.allowedMimeTypes,
			});

			file.value = response.data.data;

			activeDialog.value = null;
			url.value = '';
			update(file.value?.id);
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}
</script>

<template>
	<div v-prevent-focusout="interfaceOpen" class="file">
		<VMenu v-model="menuOpen" attached :disabled="loading || internalDisabled">
			<template #activator="{ toggle, active, deactivate }">
				<div>
					<VSkeletonLoader v-if="loading" type="input" />

					<VListItem
						v-else
						class="activator"
						clickable
						readonly
						block
						:active
						:disabled="!(nonEditable && file) && internalDisabled"
						:non-editable="nonEditable"
						:placeholder="$t('no_file_selected')"
						:model-value="file && file.title"
						@click="!nonEditable ? toggle() : (editDrawerActive = true)"
					>
						<VListItemIcon>
							<div
								class="preview"
								:class="{
									'has-file': file,
									'is-svg': file?.type?.includes('svg'),
								}"
							>
								<VImage
									v-if="imageThumbnail && !imageThumbnailError"
									:src="imageThumbnail"
									:alt="file?.title"
									@error="imageThumbnailError = $event"
								/>
								<span v-else-if="fileExtension" class="extension">
									{{ fileExtension }}
								</span>
								<VIcon v-else name="folder_open" />
							</div>
						</VListItemIcon>

						<VListItemContent>
							<VTextOverflow v-if="file?.title" :text="file.title" />
							<VTextOverflow v-else class="placeholder" :text="$t('no_file_selected')" />
						</VListItemContent>

						<div v-if="!nonEditable" class="item-actions">
							<template v-if="file">
								<VIcon
									v-tooltip="!internalDisabled && $t('edit_item')"
									name="edit"
									clickable
									:disabled="internalDisabled"
									@click.stop="
										deactivate();
										editDrawerActive = true;
									"
								/>

								<VRemove
									:item-info="relationInfo"
									:item-edits="edits"
									deselect
									:disabled="internalDisabled"
									@action="remove"
								/>
							</template>

							<VIcon v-else name="attach_file" />
						</div>
					</VListItem>
				</div>
			</template>

			<VList>
				<template v-if="file">
					<VListItem clickable :download="file.filename_download" :href="getAssetUrl(file.id, { isDownload: true })">
						<VListItemIcon><VIcon name="get_app" /></VListItemIcon>
						<VListItemContent>{{ $t('download_file') }}</VListItemContent>
					</VListItem>

					<VDivider v-if="!internalDisabled" />
				</template>
				<template v-if="!internalDisabled">
					<VListItem v-if="createAllowed && enableCreate" clickable @click="activeDialog = 'upload'">
						<VListItemIcon><VIcon name="phonelink" /></VListItemIcon>
						<VListItemContent>
							{{ $t(file ? 'replace_from_device' : 'upload_from_device') }}
						</VListItemContent>
					</VListItem>

					<VListItem v-if="enableSelect" clickable @click="activeDialog = 'choose'">
						<VListItemIcon><VIcon name="folder_open" /></VListItemIcon>
						<VListItemContent>
							{{ $t(file ? 'replace_from_library' : 'choose_from_library') }}
						</VListItemContent>
					</VListItem>

					<VListItem v-if="createAllowed && enableCreate" clickable @click="activeDialog = 'url'">
						<VListItemIcon><VIcon name="link" /></VListItemIcon>
						<VListItemContent>
							{{ $t(file ? 'replace_from_url' : 'import_from_url') }}
						</VListItemContent>
					</VListItem>
				</template>
			</VList>
		</VMenu>

		<DrawerItem
			v-if="file"
			v-model:active="editDrawerActive"
			collection="directus_files"
			:primary-key="file.id"
			:edits="edits"
			:disabled="internalDisabled"
			:non-editable="nonEditable"
			@input="update"
		>
			<template #actions>
				<PrivateViewHeaderBarActionButton
					icon="download"
					:href="getAssetUrl(file.id, { isDownload: true })"
					:download="file.filename_download"
					secondary
				/>
			</template>
		</DrawerItem>

		<VDialog
			:model-value="activeDialog === 'upload'"
			@esc="activeDialog = null"
			@update:model-value="activeDialog = null"
		>
			<VCard>
				<VCardTitle>{{ $t('upload_from_device') }}</VCardTitle>
				<VCardText>
					<VUpload from-url :folder="folder" :accept="combinedAcceptString" @input="onUpload" />
				</VCardText>
				<VCardActions>
					<VButton secondary @click="activeDialog = null">{{ $t('cancel') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<DrawerFiles
			v-if="activeDialog === 'choose'"
			:folder="folder"
			:active="activeDialog === 'choose'"
			:filter="customFilter"
			@update:active="activeDialog = null"
			@input="setSelection"
		/>

		<VDialog
			:model-value="activeDialog === 'url'"
			:persistent="urlLoading"
			@update:model-value="activeDialog = null"
			@esc="activeDialog = null"
		>
			<VCard>
				<VCardTitle>{{ $t('import_from_url') }}</VCardTitle>
				<VCardText>
					<VInput v-model="url" autofocus :placeholder="$t('url')" :nullable="false" :disabled="urlLoading" />
				</VCardText>
				<VCardActions>
					<VButton :disabled="urlLoading" secondary @click="activeDialog = null">
						{{ $t('cancel') }}
					</VButton>
					<VButton :loading="urlLoading" :disabled="isValidURL === false" @click="importFromURL">
						{{ $t('import_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list-item.activator {
	--v-list-item-color-active: var(--v-list-item-color);
	--v-list-item-background-color-active: var(
		--v-list-item-background-color,
		var(--v-list-background-color, var(--theme--form--field--input--background))
	);

	&.disabled:not(.non-editable) {
		--v-list-item-color: var(--theme--foreground-subdued);
		--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
		--v-list-item-border-color: var(--v-input-border-color, var(--theme--form--field--input--border-color));
	}

	&.active:not(.disabled),
	&:focus-within:not(.disabled),
	&:focus-visible:not(.disabled) {
		--v-list-item-border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
		--v-list-item-border-color-hover: var(--v-list-item-border-color);

		offset: 0;
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}

.item-actions {
	@include mixins.list-interface-item-actions;

	padding-inline-start: 8px;
}

.preview {
	--v-icon-color: var(--theme--form--field--input--foreground-subdued);

	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 40px;
	block-size: 40px;
	margin-inline-start: -8px;
	overflow: hidden;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);

	img {
		inline-size: 100%;
		block-size: 100%;
		object-fit: cover;
	}

	&.has-file {
		background-color: var(--theme--primary-background);
	}

	&.is-svg {
		padding: 4px;

		img {
			object-fit: contain;
			filter: drop-shadow(0 0 8px rgb(0 0 0 / 0.25));
		}
	}
}

.placeholder {
	color: var(--v-input-placeholder-color, var(--theme--foreground-subdued));
}

.extension {
	color: var(--theme--primary);
	font-weight: 600;
	font-size: 11px;
	text-transform: uppercase;
}
</style>
