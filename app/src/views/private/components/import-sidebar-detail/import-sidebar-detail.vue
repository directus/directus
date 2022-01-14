<template>
	<sidebar-detail icon="playlist_add" :title="t('import_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ t('file') }}</p>
				<div v-if="uploading || importing" class="uploading">
					<div class="type-text">
						<span>{{ importing ? t('import_data_indeterminate') : t('upload_file_indeterminate') }}</span>
						<span v-if="!importing">{{ progress }}%</span>
					</div>
					<v-progress-linear :indeterminate="importing" :value="progress" rounded />
				</div>
				<v-input v-else clickable>
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
							{{ file ? file.name : t('no_file_selected') }}
						</span>
					</template>
					<template #append>
						<template v-if="file">
							<v-icon v-tooltip="t('deselect')" class="deselect" name="close" @click.stop="clearFileInput" />
						</template>
						<v-icon v-else name="attach_file" />
					</template>
				</v-input>
			</div>

			<div class="field full">
				<v-button full-width :disabled="!file" :loading="uploading || importing" @click="importData">
					{{ t('import_collection', { collection }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed } from 'vue';
import api from '@/api';
import readableMimeType from '@/utils/readable-mime-type';
import { notify } from '@/utils/notify';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	emits: ['refresh'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fileInput = ref<HTMLInputElement | null>(null);

		const file = ref<File | null>(null);
		const { uploading, progress, importing, uploadFile } = useUpload();

		const fileExtension = computed(() => {
			if (file.value === null) return null;
			return readableMimeType(file.value.type, true);
		});

		return { t, fileInput, file, fileExtension, onChange, clearFileInput, importData, uploading, progress, importing };

		function onChange(event: Event) {
			const files = (event.target as HTMLInputElement)?.files;

			if (files && files.length > 0) {
				file.value = files.item(0)!;
			}
		}

		function clearFileInput() {
			fileInput.value!.value = '';
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
						type: 'success',
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
</style>
