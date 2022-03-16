<template>
	<sidebar-detail icon="import_export" :title="t('import_export')">
		<div class="fields">
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
							<label for="import-file" class="import-file-label"></label>
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

			<div class="field full">
				<v-button small full-width @click="exportDialogActive = true">
					{{ t('export_items') }}
				</v-button>
			</div>
		</div>

		<v-drawer v-model="exportDialogActive" :title="t('export_items')">
			<div class="export-fields">
				<div class="field half">
					<p class="type-label">{{ t('format') }}</p>
					<v-select
						v-model="exportSettings.format"
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
						]"
					/>
				</div>
				<div class="field half">
					<p class="type-label">{{ t('limit') }}</p>
					<v-input v-model="exportSettings.limit" type="number" />
				</div>

				<v-divider />

				<!-- SORT -->
				<div class="field half-left">
					<p class="type-label">{{ t('sort_field') }}</p>
				</div>
				<div class="field half-right">
					<p class="type-label">{{ t('sort_direction') }}</p>
				</div>
				<!-- ENDSORT -->

				<div class="field full">
					<p class="type-label">{{ t('full_text_search') }}</p>
					<v-input v-model="exportSettings.search" :placeholder="search" />
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
						@input="exportSettings.fields = $event"
					/>
				</div>
			</div>
		</v-drawer>
	</sidebar-detail>
</template>

<script lang="ts" setup>
import api from '../../../api';
import { getRootPath } from '../../../utils/get-root-path';
import { notify } from '../../../utils/notify';
import readableMimeType from '../../../utils/readable-mime-type';
import { Filter } from '@directus/shared/types';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollection } from '@directus/shared/composables';

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

const emit = defineEmits(['refresh']);

const { t } = useI18n();

const fileInput = ref<HTMLInputElement | null>(null);

const file = ref<File | null>(null);
const { uploading, progress, importing, uploadFile } = useUpload();

const exportDialogActive = ref(false);

const fileExtension = computed(() => {
	if (file.value === null) return null;
	return readableMimeType(file.value.type, true);
});

const { primaryKeyField } = useCollection(props.collection);

const exportSettings = reactive({
	limit: props.layoutQuery?.limit ?? 25,
	format: 'csv',
	filter: props.filter,
	search: props.search,
	fields: props.layoutQuery?.fields ?? [primaryKeyField.value!.field],
	sort: props.layoutQuery?.sort ?? `${primaryKeyField.value!.field}`,
});

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
			await api.post(`/utils/import/${props.collection}`, formData, {
				onUploadProgress: (progressEvent: ProgressEvent) => {
					const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
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
			notify({
				title: t('import_data_error'),
				type: 'error',
			});
		} finally {
			uploading.value = false;
			importing.value = false;
			progress.value = 0;
		}
	}
}

function exportDataLocal() {
	const endpoint = props.collection.startsWith('directus_')
		? `${props.collection.substring(9)}`
		: `items/${props.collection}`;

	const url = getRootPath() + endpoint;

	let params: Record<string, unknown> = {
		access_token: api.defaults.headers.common['Authorization'].substring(7),
		export: exportSettings.format,
	};

	if (exportSettings.sort) params.sort = exportSettings.sort;
	if (exportSettings.fields) params.fields = exportSettings.fields;
	if (exportSettings.limit) params.limit = props.layoutQuery.limit;
	if (exportSettings.search) params.search = exportSettings.search;
	if (exportSettings.filter) params.filter = exportSettings.filter;
	if (exportSettings.search) params.search = exportSettings.search;

	const exportUrl = api.getUri({
		url,
		params,
	});

	window.open(exportUrl);
}
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

	&.no-file {
		color: var(--foreground-subdued);
	}
}

:deep(.v-button) .button:disabled {
	--v-button-background-color-disabled: var(--background-normal-alt);
}
</style>
