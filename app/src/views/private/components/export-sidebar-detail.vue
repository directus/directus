<script setup lang="ts">
import api from '@/api';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { useServerStore } from '@/stores/server';
import { getPublicURL } from '@/utils/get-root-path';
import { notify } from '@/utils/notify';
import { readableMimeType } from '@/utils/readable-mime-type';
import { unexpectedError } from '@/utils/unexpected-error';
import type { APIError } from '@/types/error';
import FolderPicker from '@/views/private/components/folder-picker.vue';
import ImportErrorDialog from './import-error-dialog.vue';
import { useCollection } from '@directus/composables';
import { Filter } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import type { AxiosProgressEvent } from 'axios';
import { debounce, pick } from 'lodash';
import { computed, reactive, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type LayoutQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
};

const props = defineProps<{
	collection: string;
	layoutQuery?: LayoutQuery;
	filter?: Filter;
	search?: string;
	onDownload?: () => Promise<void>;
}>();

const emit = defineEmits(['refresh']);

const { t, n } = useI18n();

const { collection } = toRefs(props);

const fileInput = ref<HTMLInputElement | null>(null);

const file = ref<File | null>(null);
const { uploading, progress, importing, uploadFile } = useUpload();

const exportDialogActive = ref(false);

const errorDialogActive = ref(false);
const errorDialogRows = ref<APIError[]>([]);

const fileExtension = computed(() => {
	if (file.value === null) return null;
	return readableMimeType(file.value.type, true);
});

const { primaryKeyField, fields, info: collectionInfo } = useCollection(collection);

const { createAllowed } = useCollectionPermissions(collection);

const { info } = useServerStore();

const queryLimitMax = info.queryLimit === undefined || info.queryLimit.max === -1 ? Infinity : info.queryLimit.max;
const defaultLimit = info.queryLimit !== undefined ? Math.min(25, queryLimitMax) : 25;

const exportSettings = reactive({
	limit: props.layoutQuery?.limit ?? defaultLimit,
	filter: props.filter,
	search: props.search,
	fields:
		props.layoutQuery?.fields ?? fields.value?.filter((field) => field.type !== 'alias').map((field) => field.field),
	sort: `${primaryKeyField.value?.field ?? ''}`,
});

watch(
	fields,
	() => {
		if (props.layoutQuery?.fields) return;
		exportSettings.fields = fields.value?.filter((field) => field.type !== 'alias').map((field) => field.field);
	},
	{ immediate: true },
);

watch(
	() => props.layoutQuery,
	() => {
		exportSettings.limit = props.layoutQuery?.limit ?? defaultLimit;

		if (props.layoutQuery?.fields) {
			exportSettings.fields = props.layoutQuery?.fields;
		}

		if (props.layoutQuery?.sort) {
			if (Array.isArray(props.layoutQuery.sort)) {
				exportSettings.sort = props.layoutQuery.sort[0];
			} else {
				exportSettings.sort = props.layoutQuery.sort;
			}
		}
	},
	{ immediate: true },
);

watch(
	[() => props.filter, () => props.search],
	([filter, search]) => {
		exportSettings.filter = filter;
		exportSettings.search = search;
	},
	{ immediate: true },
);

const format = ref('csv');
const location = ref('download');
const folder = ref<string | null>(null);

const lockedToFiles = ref<{ previousLocation: string } | null>(null);

const itemCountTotal = ref<number>();
const itemCount = ref<number>();
const itemCountLoading = ref(false);

const getItemCount = async () => {
	itemCountLoading.value = true;

	try {
		const aggregate = primaryKeyField.value?.field
			? {
					countDistinct: [primaryKeyField.value.field],
				}
			: {
					count: ['*'],
				};

		const response = await api.get(getEndpoint(collection.value), {
			params: {
				...pick(exportSettings, ['search', 'filter']),
				aggregate,
			},
		});

		let count;

		if (response.data.data?.[0]?.count) {
			count = Number(response.data.data[0].count);
		}

		if (response.data.data?.[0]?.countDistinct) {
			count = Number(response.data.data[0].countDistinct[primaryKeyField.value!.field]);
		}

		itemCount.value = count;
		return count;
	} finally {
		itemCountLoading.value = false;
	}
};

watch([() => exportSettings.search, () => exportSettings.filter], debounce(getItemCount, 250));

watch(
	() => exportSettings.limit,
	() => {
		if (exportSettings.limit < -1) {
			exportSettings.limit = -1;
		}

		if (
			exportSettings.limit !== null &&
			!Number.isNaN(exportSettings.limit) &&
			!Number.isInteger(exportSettings.limit)
		) {
			exportSettings.limit = Math.round(exportSettings.limit);
		}
	},
);

const exportCount = computed(() => {
	const limit = exportSettings.limit === null || exportSettings.limit === -1 ? Infinity : exportSettings.limit;
	return itemCount.value !== undefined ? Math.min(itemCount.value, limit) : limit;
});

watch(
	exportCount,
	() => {
		const queryLimitThreshold = exportCount.value > queryLimitMax;
		const batchThreshold = exportCount.value >= 2500;

		if (queryLimitThreshold || batchThreshold) {
			lockedToFiles.value = {
				previousLocation: lockedToFiles.value?.previousLocation ?? location.value,
			};

			location.value = 'files';
		} else if (lockedToFiles.value) {
			location.value = lockedToFiles.value.previousLocation;
			lockedToFiles.value = null;
		}
	},
	{ immediate: true },
);

watch(primaryKeyField, (newVal) => {
	exportSettings.sort = newVal?.field ?? '';
});

const sortDirection = computed({
	get() {
		return exportSettings.sort.startsWith('-') ? 'DESC' : 'ASC';
	},
	set(newDirection: 'ASC' | 'DESC') {
		if (newDirection === 'ASC') {
			if (exportSettings.sort.startsWith('-')) {
				exportSettings.sort = exportSettings.sort.substring(1);
			}
		} else {
			if (exportSettings.sort.startsWith('-') === false) {
				exportSettings.sort = `-${exportSettings.sort}`;
			}
		}
	},
});

const sortField = computed({
	get() {
		if (exportSettings.sort.startsWith('-')) return exportSettings.sort.substring(1);
		return exportSettings.sort;
	},
	set(newSortField: string) {
		exportSettings.sort = newSortField;
	},
});

const exporting = ref(false);

async function openExportDialog() {
	itemCountTotal.value = await getItemCount();
	exportDialogActive.value = true;
}

function onChange(event: Event) {
	const files = (event.target as HTMLInputElement)?.files;

	if (files && files.length > 0) {
		file.value = files.item(0)!;
	}
}

function clearFileInput() {
	if (fileInput.value) fileInput.value.value = '';
	file.value = null;
}

function openFileBrowser() {
	fileInput.value?.click();
}

function importData() {
	uploadFile(file.value!);
}

function useUpload() {
	const uploading = ref(false);
	const importing = ref(false);
	const progress = ref(0);

	return { uploading, progress, importing, uploadFile };

	async function uploadFile(file: File) {
		uploading.value = true;
		importing.value = false;
		progress.value = 0;

		const formData = new FormData();
		formData.append('file', file);

		try {
			await api.post(`/utils/import/${collection.value}`, formData, {
				onUploadProgress: (progressEvent: AxiosProgressEvent) => {
					const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total!);
					progress.value = percentCompleted;
					importing.value = percentCompleted === 100 ? true : false;
				},
			});

			clearFileInput();

			emit('refresh');

			notify({
				title: t('import_data_success', { filename: file.name }),
			});
		} catch (error: any) {
			const errors = error?.response?.data?.errors;
			const code = errors?.[0]?.extensions?.code;

			if (code === 'FAILED_VALIDATION' && Array.isArray(errors)) {
				errorDialogRows.value = errors;
				errorDialogActive.value = true;
			} else {
				unexpectedError(error);
			}
		} finally {
			uploading.value = false;
			importing.value = false;
			progress.value = 0;
		}
	}
}

function startExport() {
	if (location.value === 'download') {
		exportDataLocal();
	} else {
		exportDataFiles();
	}
}

function exportDataLocal() {
	const endpoint = getEndpoint(collection.value);

	// usually getEndpoint contains leading slash, but here we need to remove it
	const url = getPublicURL() + endpoint.substring(1);

	const params: Record<string, unknown> = {
		export: format.value,
	};

	if (exportSettings.sort && exportSettings.sort !== '') params.sort = exportSettings.sort;
	if (exportSettings.fields) params.fields = exportSettings.fields;
	if (exportSettings.search) params.search = exportSettings.search;
	if (exportSettings.filter) params.filter = exportSettings.filter;
	if (exportSettings.search) params.search = exportSettings.search;

	params.limit = exportSettings.limit ? Math.min(exportSettings.limit, queryLimitMax) : -1;

	const exportUrl = api.getUri({
		url,
		params,
	});

	window.open(exportUrl);
}

async function exportDataFiles() {
	if (exporting.value) return;

	exporting.value = true;

	try {
		await api.post(`/utils/export/${collection.value}`, {
			query: {
				...exportSettings,
				...(exportSettings.sort && exportSettings.sort !== '' && { sort: [exportSettings.sort] }),
			},
			format: format.value,
			file: {
				folder: folder.value,
			},
		});

		exportDialogActive.value = false;

		notify({
			title: t('export_started'),
			text: t('export_started_copy'),
			type: 'success',
			icon: 'file_download',
		});
	} catch (error) {
		unexpectedError(error);
	} finally {
		exporting.value = false;
	}
}
</script>

<template>
	<sidebar-detail icon="import_export" :title="t('import_export')">
		<div class="fields">
			<template v-if="createAllowed">
				<div class="field full">
					<div v-if="uploading || importing" class="uploading">
						<div class="type-text">
							<span>{{ importing ? t('import_data_indeterminate') : t('upload_file_indeterminate') }}</span>
							<span v-if="!importing">{{ progress }}%</span>
						</div>
						<v-progress-linear :indeterminate="importing" :value="progress" rounded />
					</div>
					<template v-else>
						<p class="type-label">{{ t('label_import') }}</p>

						<v-list-item v-tooltip="file && file.name" block clickable @click="openFileBrowser">
							<v-list-item-icon>
								<div class="preview" :class="{ 'has-file': file }">
									<span v-if="fileExtension" class="extension">{{ fileExtension }}</span>
									<v-icon v-else name="folder_open" />
								</div>
							</v-list-item-icon>

							<v-list-item-content>
								<input
									id="import-file"
									ref="fileInput"
									type="file"
									accept="text/csv, application/json"
									hidden
									@change="onChange"
								/>

								<span class="import-file-text" :class="{ 'no-file': !file }">
									{{ file ? file.name : t('import_data_input_placeholder') }}
								</span>
							</v-list-item-content>

							<div class="item-actions">
								<v-remove v-if="file" deselect @action="clearFileInput" />

								<v-icon v-else name="attach_file" />
							</div>
						</v-list-item>
					</template>
				</div>

				<div class="field full">
					<v-button small full-width :disabled="!file" :loading="uploading || importing" @click="importData">
						{{ t('import_data_button') }}
					</v-button>
				</div>

				<v-divider />
			</template>

			<div class="field full">
				<v-button small full-width @click="openExportDialog">
					{{ t('export_items') }}
				</v-button>

				<button
					v-tooltip.bottom="
						!!onDownload ? t('presentation_text_values_cannot_be_reimported') : t('download_page_as_csv_unsupported')
					"
					class="download-local"
					:disabled="!onDownload"
					@click="onDownload"
				>
					{{ t('download_page_as_csv') }}
				</button>
			</div>
		</div>

		<v-drawer
			v-model="exportDialogActive"
			:title="t('export_items')"
			icon="import_export"
			persistent
			@cancel="exportDialogActive = false"
			@apply="startExport"
		>
			<template #actions>
				<v-button
					v-tooltip.bottom="location === 'download' ? t('download_file') : t('start_export')"
					rounded
					icon
					:loading="exporting"
					@click="startExport"
				>
					<v-icon :name="location === 'download' ? 'download' : 'start'" />
				</v-button>
			</template>
			<div class="export-fields">
				<div class="field half-left">
					<p class="type-label">{{ t('format') }}</p>
					<v-select
						v-model="format"
						:items="[
							{
								text: t('csv'),
								value: 'csv',
							},
							{
								text: t('json'),
								value: 'json',
							},
							{
								text: t('xml'),
								value: 'xml',
							},
							{
								text: t('yaml'),
								value: 'yaml',
							},
						]"
					/>
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('limit') }}</p>
					<v-input v-model="exportSettings.limit" type="number" :min="-1" :step="1" :placeholder="t('unlimited')" />
				</div>

				<div class="field half-left">
					<p class="type-label">{{ t('export_location') }}</p>
					<v-select
						v-model="location"
						:disabled="lockedToFiles !== null"
						:items="[
							{ value: 'download', text: t('download_file') },
							{ value: 'files', text: t('file_library') },
						]"
					/>
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('folder') }}</p>
					<folder-picker v-if="location === 'files'" v-model="folder" />
					<v-notice v-else>{{ t('not_available_for_local_downloads') }}</v-notice>
				</div>

				<v-notice class="full" :type="lockedToFiles ? 'warning' : 'normal'">
					<div>
						<p v-if="itemCountLoading">
							{{ t('loading') }}
						</p>

						<p v-else-if="exportCount === 0">
							{{ t('exporting_no_items_to_export') }}
						</p>

						<p v-else-if="itemCountTotal && exportCount >= itemCountTotal">
							{{
								t('exporting_all_items_in_collection', {
									total: itemCountTotal ? n(itemCountTotal) : '??',
									collection: collectionInfo?.name,
								})
							}}
						</p>

						<p v-else-if="itemCountTotal && exportCount < itemCountTotal">
							{{
								t('exporting_limited_items_in_collection', {
									count: n(exportCount),
									total: itemCountTotal ? n(itemCountTotal) : '??',
									collection: collectionInfo?.name,
								})
							}}
						</p>

						<p v-if="lockedToFiles">
							{{ t('exporting_library_hint_forced', { format: t(format) }) }}
						</p>

						<p v-else-if="location === 'files'">
							{{ t('exporting_library_hint', { format: t(format) }) }}
						</p>

						<p v-else>
							{{ t('exporting_download_hint', { format: t(format) }) }}
						</p>
					</div>
				</v-notice>

				<v-divider />

				<div class="field half-left">
					<p class="type-label">{{ t('sort_field') }}</p>
					<interface-system-field
						:value="sortField"
						:collection-name="collection"
						allow-primary-key
						@input="sortField = $event"
					/>
				</div>
				<div class="field half-right">
					<p class="type-label">{{ t('sort_direction') }}</p>
					<v-select
						v-model="sortDirection"
						:items="[
							{ value: 'ASC', text: t('sort_asc') },
							{ value: 'DESC', text: t('sort_desc') },
						]"
					/>
				</div>

				<div class="field full">
					<p class="type-label">{{ t('full_text_search') }}</p>
					<v-input v-model="exportSettings.search" :placeholder="t('search')" />
				</div>
				<div class="field full">
					<p class="type-label">{{ t('filter') }}</p>
					<interface-system-filter
						:value="exportSettings.filter"
						:collection-name="collection"
						@input="exportSettings.filter = $event"
					/>
				</div>
				<div class="field full">
					<p class="type-label">{{ t('field', 2) }}</p>
					<interface-system-fields
						:value="exportSettings.fields"
						:collection-name="collection"
						allow-select-all
						@input="exportSettings.fields = $event"
					/>
				</div>
			</div>
		</v-drawer>

		<import-error-dialog v-model="errorDialogActive" :errors="errorDialogRows" :collection="collection" />
	</sidebar-detail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list-item {
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
}

.fields,
.export-fields {
	@include mixins.form-grid;

	.v-divider {
		grid-column: 1 / span 2;
	}
}

.fields {
	--theme--form--row-gap: 24px;

	.type-label {
		font-size: 1rem;
	}
}

.export-fields {
	--folder-picker-background-color: var(--theme--background-subdued);
	--folder-picker-color: var(--theme--background-normal);

	margin-block-start: 24px;
	padding: var(--content-padding);
}

.v-checkbox {
	inline-size: 100%;
	margin-block-start: 8px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.uploading {
	--v-progress-linear-color: var(--white);
	--v-progress-linear-background-color: rgb(255 255 255 / 0.25);

	display: flex;
	flex-direction: column;
	justify-content: center;
	block-size: var(--theme--form--field--input--height);
	padding: var(--theme--form--field--input--padding);
	padding-block: 0;
	color: var(--white);
	background-color: var(--theme--primary);
	border: var(--theme--border-width) solid var(--theme--primary);
	border-radius: var(--theme--border-radius);

	.type-text {
		display: flex;
		justify-content: space-between;
		margin-block-end: 4px;
		color: var(--white);
	}

	.v-progress-linear {
		margin-block-end: 4px;
	}
}

.preview {
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 40px;
	block-size: 40px;
	margin-inline-start: -8px;
	overflow: hidden;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);

	&.has-file {
		background-color: var(--theme--primary-background);
	}
}

.extension {
	color: var(--theme--primary);
	font-weight: 600;
	font-size: 11px;
	text-transform: uppercase;
}

.import-file-text {
	flex-grow: 1;
	overflow: hidden;
	line-height: normal;
	white-space: nowrap;
	text-overflow: ellipsis;

	&.no-file {
		color: var(--theme--foreground-subdued);
	}
}

:deep(.v-button) .button:disabled {
	--v-button-background-color-disabled: var(--theme--background-accent);
}

.download-local {
	color: var(--theme--foreground-subdued);
	text-align: center;
	display: block;
	inline-size: 100%;
	margin-block-start: 8px;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--primary);
	}

	&:disabled {
		color: var(--theme--foreground-subdued);
		cursor: not-allowed;
	}
}
</style>
