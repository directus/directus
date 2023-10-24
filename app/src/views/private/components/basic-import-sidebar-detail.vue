<script setup lang="ts">
import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { notify } from '@/utils/notify';
import { readableMimeType } from '@/utils/readable-mime-type';
import { unexpectedError } from '@/utils/unexpected-error';
import type { AxiosProgressEvent } from 'axios';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	collection: string;
}>();

const emit = defineEmits(['refresh', 'download']);

const { t, te } = useI18n();

const { collection } = toRefs(props);

const fileInput = ref<HTMLInputElement | null>(null);

const file = ref<File | null>(null);
const { uploading, progress, importing, uploadFile } = useUpload();

const fileExtension = computed(() => {
	if (file.value === null) return null;
	return readableMimeType(file.value.type, true);
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

const { hasPermission } = usePermissionsStore();

const createAllowed = computed<boolean>(() => hasPermission(collection.value, 'create'));
</script>

<template>
	<sidebar-detail icon="publish" :title="t('label_import')">
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
			</template>
		</div>
	</sidebar-detail>
</template>

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
	background-color: var(--theme--primary);
	border: var(--border-width) solid var(--theme--primary);
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
	--v-icon-color: var(--theme--foreground-subdued);

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
		background-color: var(--theme--primary-background);
	}
}

.extension {
	color: var(--theme--primary);
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
		color: var(--theme--foreground-subdued);
	}
}

:deep(.v-button) .button:disabled {
	--v-button-background-color-disabled: var(--background-normal-alt);
}

.download-local {
	color: var(--theme--foreground-subdued);
	text-align: center;
	display: block;
	width: 100%;
	margin-top: 8px;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--primary);
	}
}
</style>
