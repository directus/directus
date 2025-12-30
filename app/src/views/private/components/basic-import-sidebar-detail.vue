<script setup lang="ts">
import ImportErrorDialog from './import-error-dialog.vue';
import SidebarDetail from './sidebar-detail.vue';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VProgressLinear from '@/components/v-progress-linear.vue';
import VRemove from '@/components/v-remove.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import type { APIError } from '@/types/error';
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

const { t } = useI18n();

const { collection } = toRefs(props);

const { createAllowed } = useCollectionPermissions(collection);

const fileInput = ref<HTMLInputElement | null>(null);

const file = ref<File | null>(null);
const { uploading, progress, importing, uploadFile } = useUpload();

const errorDialogActive = ref(false);
const errorDialogRows = ref<APIError[]>([]);

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
</script>

<template>
	<SidebarDetail id="import" icon="publish" :title="$t('label_import')">
		<div class="fields">
			<template v-if="createAllowed">
				<div class="field full">
					<div v-if="uploading || importing" class="uploading">
						<div class="type-text">
							<span>{{ importing ? $t('import_data_indeterminate') : $t('upload_file_indeterminate') }}</span>
							<span v-if="!importing">{{ progress }}%</span>
						</div>
						<VProgressLinear :indeterminate="importing" :value="progress" rounded />
					</div>
					<template v-else>
						<p class="type-label">{{ $t('label_import') }}</p>
						<VInput clickable>
							<template #prepend>
								<div class="preview" :class="{ 'has-file': file }">
									<span v-if="fileExtension" class="extension">{{ fileExtension }}</span>
									<VIcon v-else name="folder_open" />
								</div>
							</template>
							<template #input>
								<label v-tooltip="file && file.name" for="import-file" class="import-file-label">
									<input
										id="import-file"
										ref="fileInput"
										type="file"
										accept="text/csv, application/json"
										@change="onChange"
									/>
								</label>
								<span class="import-file-text" :class="{ 'no-file': !file }">
									{{ file ? file.name : $t('import_data_input_placeholder') }}
								</span>
							</template>
							<template #append>
								<div class="item-actions">
									<VRemove v-if="file" deselect @action="clearFileInput" />

									<VIcon v-else name="attach_file" />
								</div>
							</template>
						</VInput>
					</template>
				</div>

				<div class="field full">
					<VButton small full-width :disabled="!file" :loading="uploading || importing" @click="importData">
						{{ $t('import_data_button') }}
					</VButton>
				</div>
			</template>
		</div>

		<ImportErrorDialog v-model="errorDialogActive" :errors="errorDialogRows" :collection="collection" />
	</SidebarDetail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

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

.import-file-label {
	position: absolute;
	inset-block-start: 0;
	inset-inline-start: 0;
	display: block;
	inline-size: 100%;
	block-size: 100%;
	cursor: pointer;
	opacity: 0;
	appearance: none;
	overflow: hidden;
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
}
</style>
