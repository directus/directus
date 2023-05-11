<template>
	<div
		data-dropzone
		class="v-upload"
		:class="{ dragging: dragging && fromUser, uploading }"
		@dragenter.prevent="onDragEnter"
		@dragover.prevent
		@dragleave.prevent="onDragLeave"
		@drop.stop.prevent="onDrop"
	>
		<template v-if="dragging && fromUser">
			<v-icon class="upload-icon" x-large name="file_upload" />
			<p class="type-label">{{ t('drop_to_upload') }}</p>
		</template>

		<template v-else-if="uploading">
			<p class="type-label">{{ progress }}%</p>
			<p class="type-text">
				{{
					multiple && numberOfFiles > 1
						? t('upload_files_indeterminate', { done: done, total: numberOfFiles })
						: t('upload_file_indeterminate')
				}}
			</p>
			<v-progress-linear :value="progress" rounded />
		</template>

		<template v-else>
			<div class="actions">
				<v-button v-if="fromUser" v-tooltip="t('click_to_browse')" icon rounded secondary @click="openFileBrowser">
					<input ref="input" class="browse" type="file" :multiple="multiple" @input="onBrowseSelect" />
					<v-icon name="file_upload" />
				</v-button>
				<v-button
					v-if="fromLibrary"
					v-tooltip="t('choose_from_library')"
					icon
					rounded
					secondary
					@click="activeDialog = 'choose'"
				>
					<v-icon name="folder_open" />
				</v-button>
				<v-button
					v-if="fromUrl && fromUser"
					v-tooltip="t('import_from_url')"
					icon
					rounded
					secondary
					@click="activeDialog = 'url'"
				>
					<v-icon name="link" />
				</v-button>
			</div>

			<p class="type-label">{{ t(fromUser ? 'drag_file_here' : 'choose_from_library') }}</p>

			<template v-if="fromUrl !== false || fromLibrary !== false">
				<drawer-files
					:active="activeDialog === 'choose'"
					:multiple="multiple"
					:folder="folder"
					@update:active="activeDialog = null"
					@input="setSelection"
				/>

				<v-dialog
					:model-value="activeDialog === 'url'"
					:persistent="urlLoading"
					@esc="activeDialog = null"
					@update:model-value="activeDialog = null"
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
			</template>
		</template>
	</div>
</template>

<script setup lang="ts">
import api from '@/api';
import emitter, { Events } from '@/events';
import { unexpectedError } from '@/utils/unexpected-error';
import { uploadFile } from '@/utils/upload-file';
import { uploadFiles } from '@/utils/upload-files';
import DrawerFiles from '@/views/private/components/drawer-files.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	multiple?: boolean;
	preset?: Record<string, any>;
	fileId?: string;
	/** In case that the user isn't allowed to upload files */
	fromUser?: boolean;
	fromUrl?: boolean;
	fromLibrary?: boolean;
	folder?: string;
}

const props = withDefaults(defineProps<Props>(), {
	multiple: false,
	preset: () => ({}),
	fileId: undefined,
	fromUser: true,
	fromUrl: false,
	fromLibrary: false,
	folder: undefined,
});

const emit = defineEmits(['input']);

const { t } = useI18n();

const { uploading, progress, upload, onBrowseSelect, done, numberOfFiles } = useUpload();
const { onDragEnter, onDragLeave, onDrop, dragging } = useDragging();
const { url, isValidURL, loading: urlLoading, importFromURL } = useURLImport();
const { setSelection } = useSelection();
const activeDialog = ref<'choose' | 'url' | null>(null);
const input = ref<HTMLInputElement>();

function validFiles(files: FileList) {
	if (files.length === 0) return false;

	for (const file of files) {
		if (file.size === 0) return false;
	}

	return true;
}

function useUpload() {
	const uploading = ref(false);
	const progress = ref(0);
	const numberOfFiles = ref(0);
	const done = ref(0);

	return { uploading, progress, upload, onBrowseSelect, numberOfFiles, done };

	async function upload(files: FileList) {
		uploading.value = true;
		progress.value = 0;

		const folderPreset: { folder?: string } = {};

		if (props.folder) {
			folderPreset.folder = props.folder;
		}

		try {
			if (!validFiles(files)) {
				throw new Error('An error has occurred while uploading the files.');
			}

			numberOfFiles.value = files.length;

			if (props.multiple === true) {
				const uploadedFiles = await uploadFiles(Array.from(files), {
					onProgressChange: (percentage) => {
						progress.value = Math.round(percentage.reduce((acc, cur) => (acc += cur)) / files.length);
						done.value = percentage.filter((p) => p === 100).length;
					},
					preset: {
						...props.preset,
						...folderPreset,
					},
				});

				uploadedFiles && emit('input', uploadedFiles);
			} else {
				const uploadedFile = await uploadFile(Array.from(files)[0], {
					onProgressChange: (percentage) => {
						progress.value = percentage;
						done.value = percentage === 100 ? 1 : 0;
					},
					fileId: props.fileId,
					preset: {
						...props.preset,
						...folderPreset,
					},
				});

				uploadedFile && emit('input', uploadedFile);
			}
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			uploading.value = false;
			done.value = 0;
			numberOfFiles.value = 0;
		}
	}

	function onBrowseSelect(event: Event) {
		const files = (event.target as HTMLInputElement)?.files;

		if (files) {
			upload(files);
		}
	}
}

function useDragging() {
	const dragging = ref(false);

	let dragCounter = 0;

	return { onDragEnter, onDragLeave, onDrop, dragging };

	function onDragEnter() {
		dragCounter++;

		if (dragCounter === 1) {
			dragging.value = true;
		}
	}

	function onDragLeave() {
		dragCounter--;

		if (dragCounter === 0) {
			dragging.value = false;
		}
	}

	function onDrop(event: DragEvent) {
		dragCounter = 0;
		dragging.value = false;

		const files = event.dataTransfer?.files;

		if (files && props.fromUser) {
			upload(files);
		}
	}
}

function useSelection() {
	return { setSelection };

	async function setSelection(selection: (string | number)[] | null) {
		if (!selection) return;

		if (props.multiple) {
			const filesResponse = await api.get(`/files`, {
				params: {
					filter: {
						id: {
							_in: selection,
						},
					},
				},
			});

			emit('input', filesResponse.data.data);
		} else {
			if (selection[0]) {
				const id = selection[0];
				const fileResponse = await api.get(`/files/${id}`);
				emit('input', fileResponse.data.data);
			} else {
				emit('input', null);
			}
		}
	}
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

			emitter.emit(Events.upload);

			if (props.multiple) {
				emit('input', [response.data.data]);
			} else {
				emit('input', response.data.data);
			}

			activeDialog.value = null;
			url.value = '';
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}
}

function openFileBrowser() {
	input.value?.click();
}
</script>

<style lang="scss" scoped>
.v-upload {
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-height: var(--input-height-tall);
	padding: 32px;
	color: var(--foreground-subdued);
	text-align: center;
	border: 2px dashed var(--border-normal);
	border-radius: var(--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: color, border-color, background-color;

	p {
		color: inherit;
	}

	&:not(.uploading):hover {
		border-color: var(--border-normal-alt);
	}
}

.actions {
	display: flex;
	justify-content: center;
	margin-bottom: 18px;

	.v-button {
		margin-right: 12px;

		&:last-child {
			margin-right: 0;
		}
	}
}

.browse {
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

.dragging {
	color: var(--primary);
	background-color: var(--primary-alt);
	border-color: var(--primary);

	* {
		pointer-events: none;
	}

	.upload-icon {
		margin: 0 auto;
		margin-bottom: 12px;
	}
}

.uploading {
	--v-progress-linear-color: var(--white);
	--v-progress-linear-background-color: rgb(255 255 255 / 0.25);
	--v-progress-linear-height: 8px;

	color: var(--white);
	background-color: var(--primary);
	border-color: var(--primary);
	border-style: solid;

	.v-progress-linear {
		position: absolute;
		bottom: 30px;
		left: 32px;
		width: calc(100% - 64px);
	}
}
</style>
