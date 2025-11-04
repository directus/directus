<script setup lang="ts">
import api from '@/api';
import { useRelationM2O } from '@/composables/use-relation-m2o';
import { useRelationPermissionsM2O } from '@/composables/use-relation-permissions';
import { RelationQuerySingle, useRelationSingle } from '@/composables/use-relation-single';
import { getAssetUrl } from '@/utils/get-asset-url';
import { parseFilter } from '@/utils/parse-filter';
import { readableMimeType } from '@/utils/readable-mime-type';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerFiles from '@/views/private/components/drawer-files.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import { Filter } from '@directus/types';
import { deepMap } from '@directus/utils';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

type FileInfo = {
	id: string;
	title: string;
	type: string;
};

const props = withDefaults(
	defineProps<{
		value: string | Record<string, any> | null;
		disabled?: boolean;
		loading?: boolean;
		folder?: string;
		filter?: Filter;
		collection: string;
		field: string;
		enableCreate?: boolean;
		enableSelect?: boolean;
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

const query = ref<RelationQuerySingle>({
	fields: ['id', 'title', 'type', 'filename_download', 'modified_on'],
});

const { collection, field } = toRefs(props);
const { relationInfo } = useRelationM2O(collection, field);

const {
	displayItem: file,
	loading,
	update,
	remove,
} = useRelationSingle(value, query, relationInfo, {
	enabled: computed(() => !props.loading),
});

const { createAllowed } = useRelationPermissionsM2O(relationInfo);

const { t } = useI18n();

const activeDialog = ref<'upload' | 'choose' | 'url' | null>(null);

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
	return parseFilter(
		deepMap(props.filter, (val: unknown) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		}),
	);
});

const internalDisabled = computed(() => {
	return props.disabled || (props.enableCreate === false && props.enableSelect === false);
});

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
	<div class="file">
		<v-menu attached :disabled="loading || internalDisabled">
			<template #activator="{ toggle, active, deactivate }">
				<div>
					<v-skeleton-loader v-if="loading" type="input" />

					<v-list-item
						v-else
						class="activator"
						clickable
						readonly
						block
						:active
						:disabled="internalDisabled"
						:placeholder="t('no_file_selected')"
						:model-value="file && file.title"
						@click="toggle"
					>
						<v-list-item-icon>
							<div
								class="preview"
								:class="{
									'has-file': file,
									'is-svg': file?.type?.includes('svg'),
								}"
							>
								<v-image
									v-if="imageThumbnail && !imageThumbnailError"
									:src="imageThumbnail"
									:alt="file?.title"
									@error="imageThumbnailError = $event"
								/>
								<span v-else-if="fileExtension" class="extension">
									{{ fileExtension }}
								</span>
								<v-icon v-else name="folder_open" />
							</div>
						</v-list-item-icon>

						<v-list-item-content>
							<v-text-overflow v-if="file?.title" :text="file.title" />
							<v-text-overflow v-else class="placeholder" :text="$t('no_file_selected')" />
						</v-list-item-content>

						<div class="item-actions">
							<template v-if="file">
								<v-icon
									v-tooltip="t('edit_item')"
									name="edit"
									clickable
									@click.stop="
										deactivate();
										editDrawerActive = true;
									"
								/>

								<v-remove
									v-if="!internalDisabled"
									:item-info="relationInfo"
									:item-edits="edits"
									deselect
									@action="remove"
								/>
							</template>

							<v-icon v-else name="attach_file" />
						</div>
					</v-list-item>
				</div>
			</template>

			<v-list>
				<template v-if="file">
					<v-list-item clickable :download="file.filename_download" :href="getAssetUrl(file.id, { isDownload: true })">
						<v-list-item-icon><v-icon name="get_app" /></v-list-item-icon>
						<v-list-item-content>{{ t('download_file') }}</v-list-item-content>
					</v-list-item>

					<v-divider v-if="!internalDisabled" />
				</template>
				<template v-if="!internalDisabled">
					<v-list-item v-if="createAllowed && enableCreate" clickable @click="activeDialog = 'upload'">
						<v-list-item-icon><v-icon name="phonelink" /></v-list-item-icon>
						<v-list-item-content>
							{{ t(file ? 'replace_from_device' : 'upload_from_device') }}
						</v-list-item-content>
					</v-list-item>

					<v-list-item v-if="enableSelect" clickable @click="activeDialog = 'choose'">
						<v-list-item-icon><v-icon name="folder_open" /></v-list-item-icon>
						<v-list-item-content>
							{{ t(file ? 'replace_from_library' : 'choose_from_library') }}
						</v-list-item-content>
					</v-list-item>

					<v-list-item v-if="createAllowed && enableCreate" clickable @click="activeDialog = 'url'">
						<v-list-item-icon><v-icon name="link" /></v-list-item-icon>
						<v-list-item-content>
							{{ t(file ? 'replace_from_url' : 'import_from_url') }}
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<drawer-item
			v-if="file"
			v-model:active="editDrawerActive"
			collection="directus_files"
			:primary-key="file.id"
			:edits="edits"
			:disabled="internalDisabled"
			@input="update"
		>
			<template #actions>
				<v-button
					secondary
					rounded
					icon
					:download="file.filename_download"
					:href="getAssetUrl(file.id, { isDownload: true })"
				>
					<v-icon name="download" />
				</v-button>
			</template>
		</drawer-item>

		<v-dialog
			:model-value="activeDialog === 'upload'"
			@esc="activeDialog = null"
			@update:model-value="activeDialog = null"
		>
			<v-card>
				<v-card-title>{{ t('upload_from_device') }}</v-card-title>
				<v-card-text>
					<v-upload from-url :folder="folder" @input="onUpload" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="activeDialog = null">{{ t('cancel') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<drawer-files
			v-if="activeDialog === 'choose'"
			:folder="folder"
			:active="activeDialog === 'choose'"
			:filter="customFilter"
			@update:active="activeDialog = null"
			@input="setSelection"
		/>

		<v-dialog
			:model-value="activeDialog === 'url'"
			:persistent="urlLoading"
			@update:model-value="activeDialog = null"
			@esc="activeDialog = null"
		>
			<v-card>
				<v-card-title>{{ t('import_from_url') }}</v-card-title>
				<v-card-text>
					<v-input v-model="url" autofocus :placeholder="t('url')" :nullable="false" :disabled="urlLoading" />
				</v-card-text>
				<v-card-actions>
					<v-button :disabled="urlLoading" secondary @click="activeDialog = null">
						{{ t('cancel') }}
					</v-button>
					<v-button :loading="urlLoading" :disabled="isValidURL === false" @click="importFromURL">
						{{ t('import_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
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

	&.active,
	&:focus-within,
	&:focus-visible {
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
