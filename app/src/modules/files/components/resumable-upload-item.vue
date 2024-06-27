<script setup lang="ts">
import VProgressLinear from '@/components/v-progress-linear.vue';
import { PreviousUpload } from '@/modules/files/composables/use-resumable-uploads';
import { uploadFile } from '@/utils/upload-file';
import { omit } from 'lodash';
import { onUnmounted, ref } from 'vue';
import * as tus from 'tus-js-client';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	upload: PreviousUpload;
}>();

const emit = defineEmits<{
	done: [];
	remove: [];
	upload: [];
	error: [error: Error | null];
}>();

const { t } = useI18n();
const input = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const paused = ref(false);
const progress = ref(0);
let controller: tus.Upload | null = null;

async function performUpload(file: File) {
	uploading.value = true;
	paused.value = false;
	progress.value = 0;

	const preset = omit(props.upload.metadata, ['filename', 'filetype']);

	emit('upload');

	try {
		if (file.size === 0) {
			throw new Error('An error has occurred while uploading the files.');
		}

		if (file.name !== props.upload.metadata.filename) {
			throw new Error('The file name does not match the original file.');
		}

		if (file.size !== props.upload.size) {
			throw new Error('The file size does not match the original file.');
		}

		await uploadFile(file, {
			onProgressChange: (percentage) => {
				progress.value = Math.round(percentage);
				if (progress.value >= 100) emit('done');
			},
			onChunkedUpload: (tusUpload) => {
				controller = tusUpload;
			},
			preset,
		});

		controller = null;
	} catch (e) {
		emit('error', e as Error);
	} finally {
		uploading.value = false;
	}
}

function onBrowseSelect(event: Event) {
	const files = (event.target as HTMLInputElement)?.files;

	if (files && files.length > 0) {
		performUpload(Array.from(files)[0]!);
	}
}

function openFileBrowser() {
	input.value?.click();
}

function start() {
	controller?.start();
	paused.value = false;
}

function pause() {
	controller?.abort();
	paused.value = true;
}

onUnmounted(() => {
	controller?.abort();
});
</script>

<template>
	<v-list-item>
		<div class="info">
			<span class="name">
				{{ upload.metadata.filename }}
			</span>
			<v-progress-linear v-if="uploading" :value="progress" rounded />
		</div>
		<div class="actions">
			<v-button
				v-if="!uploading && !paused"
				v-tooltip="t('click_to_browse')"
				x-small
				secondary
				@click="openFileBrowser"
			>
				<v-icon name="not_started" />
				<span>{{ t('resume') }}</span>
				<input ref="input" class="browse" type="file" :multiple="false" hidden @input="onBrowseSelect" />
			</v-button>
			<v-button v-else-if="!paused" x-small secondary @click="pause">
				<v-icon name="pause_circle" />
				<span>{{ t('pause') }}</span>
			</v-button>
			<v-button v-else x-small secondary @click="start">
				<v-icon name="not_started" />
				<span>{{ t('resume') }}</span>
			</v-button>
			<v-icon v-tooltip="t('cancel')" class="remove" name="close" clickable @click="emit('remove')" />
		</div>
	</v-list-item>
</template>

<style lang="scss" scoped>
.v-list-item {
	display: flex;
	justify-content: stretch;
	align-items: center;
	gap: 20px;

	.info {
		display: flex;
		flex-direction: column;
		flex: 1;
		line-break: anywhere;

		gap: 4px;
	}

	.actions {
		--v-icon-size: 20px;

		display: flex;
		align-items: center;
		gap: 8px;
		padding-right: 6px;

		.v-button :deep(.x-small) {
			padding: 0 12px 0 6px;

			.content {
				gap: 6px;
			}
		}

		.browse {
			display: none;
		}

		.remove {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}

	& + .v-list-item {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		border-top: 1px solid var(--theme--border-color);
	}
}
</style>
