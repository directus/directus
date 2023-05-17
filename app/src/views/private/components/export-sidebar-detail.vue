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
						<v-input clickable>
							<template #prepend>
								<div class="preview" :class="{ 'has-file': file }">
									<span v-if="fileExtension" class="extension">{{ fileExtension }}</span>
									<v-icon v-else name="folder_open" />
								</div>
							</template>
							<template #input>
								<input
									id="import-file"
									ref="fileInput"
									type="file"
									accept="text/csv, application/json"
									hidden
									@change="onChange"
								/>
								<label v-tooltip="file && file.name" for="import-file" class="import-file-label"></label>
								<span class="import-file-text" :class="{ 'no-file': !file }">
									{{ file ? file.name : t('import_data_input_placeholder') }}
								</span>
							</template>
							<template #append>
								<template v-if="file">
									<v-icon v-tooltip="t('deselect')" class="deselect" name="close" @click.stop="clearFileInput" />
								</template>
								<v-icon v-else name="attach_file" />
							</template>
						</v-input>
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
				<v-button small full-width @click="exportDialogActive = true">
					{{ t('export_items') }}
				</v-button>

				<button
					v-tooltip.bottom="t('presentation_text_values_cannot_be_reimported')"
					class="download-local"
					@click="$emit('download')"
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
			@esc="exportDialogActive = false"
			@cancel="exportDialogActive = false"
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
						:disabled="lockedToFiles"
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
						<p>
							<template v-if="exportSettings.limit === 0 || itemCount === 0">
								{{ t('exporting_no_items_to_export') }}
							</template>
							<template
								v-else-if="
									!exportSettings.limit ||
									exportSettings.limit === -1 ||
									(itemCount && exportSettings.limit >= itemCount)
								"
							>
								{{
									t('exporting_all_items_in_collection', {
										total: itemCount ? n(itemCount) : '??',
										collection: collectionInfo?.name,
									})
								}}
							</template>

							<template v-else-if="itemCount && itemCount > exportSettings.limit">
								{{
									t('exporting_limited_items_in_collection', {
										limit: exportSettings.limit ? n(exportSettings.limit) : '??',
										total: itemCount ? n(itemCount) : '??',
										collection: collectionInfo?.name,
									})
								}}
							</template>
						</p>

						<p>
							<template v-if="lockedToFiles">
								{{ t('exporting_batch_hint_forced', { format }) }}
							</template>

							<template v-else-if="location === 'files'">
								{{ t('exporting_batch_hint', { format }) }}
							</template>

							<template v-else>
								{{ t('exporting_download_hint', { format }) }}
							</template>
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
	</sidebar-detail>
</template>

<script setup lang="ts">
import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { getPublicURL } from '@/utils/get-root-path';
import { notify } from '@/utils/notify';
import { readableMimeType } from '@/utils/readable-mime-type';
import { unexpectedError } from '@/utils/unexpected-error';
import FolderPicker from '@/views/private/components/folder-picker.vue';
import { useCollection } from '@directus/composables';
import { Filter } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import type { AxiosProgressEvent } from 'axios';
import { debounce } from 'lodash';
import { computed, reactive, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type LayoutQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
};

interface Props {
	collection: string;
	layoutQuery?: LayoutQuery;
	filter?: Filter;
	search?: string;
}

const props = withDefaults(defineProps<Props>(), {
	layoutQuery: undefined,
	filter: undefined,
	search: undefined,
});

const emit = defineEmits(['refresh', 'download']);

const { t, n, te } = useI18n();

const { collection } = toRefs(props);

const fileInput = ref<HTMLInputElement | null>(null);

const file = ref<File | null>(null);
const { uploading, progress, importing, uploadFile } = useUpload();

const exportDialogActive = ref(false);

const fileExtension = computed(() => {
	if (file.value === null) return null;
	return readableMimeType(file.value.type, true);
});

const { primaryKeyField, fields, info: collectionInfo } = useCollection(collection);

const exportSettings = reactive({
	limit: props.layoutQuery?.limit ?? 25,
	filter: props.filter,
	search: props.search,
	fields: props.layoutQuery?.fields ?? fields.value?.map((field) => field.field),
	sort: `${primaryKeyField.value?.field ?? ''}`,
});

watch(
	fields,
	() => {
		if (props.layoutQuery?.fields) return;
		exportSettings.fields = fields.value?.map((field) => field.field);
	},
	{ immediate: true }
);

watch(
	() => props.layoutQuery,
	() => {
		exportSettings.limit = props.layoutQuery?.limit ?? 25;

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
	{ immediate: true }
);

watch(
	[() => props.filter, () => props.search],
	([filter, search]) => {
		exportSettings.filter = filter;
		exportSettings.search = search;
	},
	{ immediate: true }
);

const format = ref('csv');
const location = ref('download');
const folder = ref<string | null>(null);

const lockedToFiles = computed(() => {
	const toBeDownloaded = exportSettings.limit ?? itemCount.value;
	return toBeDownloaded >= 2500;
});

watch(
	() => exportSettings.limit,
	() => {
		if (lockedToFiles.value) {
			location.value = 'files';
		}
	}
);

const itemCount = ref<number>();
const itemCountLoading = ref(false);

const getItemCount = debounce(async () => {
	itemCountLoading.value = true;

	try {
		const aggregate = primaryKeyField.value?.field
			? {
					countDistinct: [primaryKeyField.value.field],
			  }
			: {
					count: ['*'],
			  };

		const count = await api
			.get(getEndpoint(collection.value), {
				params: {
					...exportSettings,
					aggregate,
				},
			})
			.then((response) => {
				if (response.data.data?.[0]?.count) {
					return Number(response.data.data[0].count);
				}

				if (response.data.data?.[0]?.countDistinct) {
					return Number(response.data.data[0].countDistinct[primaryKeyField.value!.field]);
				}
			});

		itemCount.value = count;
	} finally {
		itemCountLoading.value = false;
	}
}, 250);

getItemCount();

watch(exportSettings, () => {
	getItemCount();
});

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
		} catch (err: any) {
			const code = err?.response?.data?.errors?.[0]?.extensions?.code;

			notify({
				title: te(`errors.${code}`) ? t(`errors.${code}`) : t('import_data_error'),
				type: 'error',
			});

			if (code === 'INTERNAL_SERVER_ERROR') {
				unexpectedError(err);
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

	let params: Record<string, unknown> = {
		access_token: (api.defaults.headers.common['Authorization'] as string).substring(7),
		export: format.value,
	};

	if (exportSettings.sort && exportSettings.sort !== '') params.sort = exportSettings.sort;
	if (exportSettings.fields) params.fields = exportSettings.fields;
	if (exportSettings.search) params.search = exportSettings.search;
	if (exportSettings.filter) params.filter = exportSettings.filter;
	if (exportSettings.search) params.search = exportSettings.search;

	params.limit = exportSettings.limit ?? -1;

	const exportUrl = api.getUri({
		url,
		params,
	});

	window.open(exportUrl);
}

async function exportDataFiles() {
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
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		exporting.value = false;
	}
}

const { hasPermission } = usePermissionsStore();

const createAllowed = computed<boolean>(() => hasPermission(collection.value, 'create'));
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields,
.export-fields {
	@include form-grid;

	.v-divider {
		grid-column: 1 / span 2;
	}
}

.fields {
	--form-vertical-gap: 24px;

	.type-label {
		font-size: 1rem;
	}
}

.export-fields {
	--folder-picker-background-color: var(--background-subdued);
	--folder-picker-color: var(--background-normal);

	margin-top: 24px;
	padding: var(--content-padding);
}

.v-checkbox {
	width: 100%;
	margin-top: 8px;
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
	height: var(--input-height);
	padding: var(--input-padding);
	padding-top: 0px;
	padding-bottom: 0px;
	color: var(--white);
	background-color: var(--primary);
	border: var(--border-width) solid var(--primary);
	border-radius: var(--border-radius);

	.type-text {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
		color: var(--white);
	}

	.v-progress-linear {
		margin-bottom: 4px;
	}
}

.preview {
	--v-icon-color: var(--foreground-subdued);

	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	margin-left: -8px;
	overflow: hidden;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);

	&.has-file {
		background-color: var(--primary-alt);
	}
}

.extension {
	color: var(--primary);
	font-weight: 600;
	font-size: 11px;
	text-transform: uppercase;
}

.import-file-label {
	position: absolute;
	top: 0;
	left: 0;
	display: block;
	width: 100%;
	height: 100%;
	cursor: pointer;
	opacity: 0;
	appearance: none;
}

.import-file-text {
	flex-grow: 1;
	overflow: hidden;
	line-height: normal;
	white-space: nowrap;
	text-overflow: ellipsis;

	&.no-file {
		color: var(--foreground-subdued);
	}
}

:deep(.v-button) .button:disabled {
	--v-button-background-color-disabled: var(--background-normal-alt);
}

.download-local {
	color: var(--foreground-subdued);
	text-align: center;
	display: block;
	width: 100%;
	margin-top: 8px;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--primary);
	}
}
</style>
