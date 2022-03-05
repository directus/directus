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
				<p class="type-label">{{ t('label_export') }}</p>
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
					]"
				/>
				<v-checkbox v-model="useFilters" :label="t('use_current_filters_settings')" />
			</div>

			<div class="field full">
				<v-button small full-width @click="exportData">
					{{ t('export_data_button') }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, PropType, computed } from 'vue';
import { Filter } from '@directus/shared/types';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { useCollectionsStore } from '@/stores/';
import readableMimeType from '@/utils/readable-mime-type';
import { notify } from '@/utils/notify';

type LayoutQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
};

export default defineComponent({
	props: {
		layoutQuery: {
			type: Object as PropType<LayoutQuery>,
			default: (): LayoutQuery => ({}),
		},
		filter: {
			type: Object as PropType<Filter>,
			default: null,
		},
		search: {
			type: String as PropType<string | null>,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	emits: ['refresh'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const format = ref('csv');
		const useFilters = ref(true);
		const collectionsStore = useCollectionsStore();
		const collectionName = computed(() => collectionsStore.getCollection(props.collection)?.name);

		const fileInput = ref<HTMLInputElement | null>(null);

		const file = ref<File | null>(null);
		const { uploading, progress, importing, uploadFile } = useUpload();

		const fileExtension = computed(() => {
			if (file.value === null) return null;
			return readableMimeType(file.value.type, true);
		});

		return {
			t,
			fileInput,
			file,
			fileExtension,
			onChange,
			clearFileInput,
			importData,
			uploading,
			progress,
			importing,
			format,
			useFilters,
			exportData,
			collectionName,
		};

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

		function exportData() {
			const endpoint = props.collection.startsWith('directus_')
				? `${props.collection.substring(9)}`
				: `items/${props.collection}`;
			const url = getRootPath() + endpoint;

			let params: Record<string, unknown> = {
				access_token: api.defaults.headers.common['Authorization'].substring(7),
				export: format.value || 'json',
			};

			if (useFilters.value === true) {
				if (props.layoutQuery?.sort) params.sort = props.layoutQuery.sort;
				if (props.layoutQuery?.fields) params.fields = props.layoutQuery.fields;
				if (props.layoutQuery?.limit) params.limit = props.layoutQuery.limit;

				if (props.search) params.search = props.search;

				if (props.filter) {
					params.filter = props.filter;
				}

				if (props.search) {
					params.search = props.search;
				}
			}

			const exportUrl = api.getUri({
				url,
				params,
			});

			window.open(exportUrl);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}

	.v-divider {
		grid-column: 1 / span 2;
	}
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
