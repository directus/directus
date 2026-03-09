<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { getAssetUrl } from '@/utils/get-asset-url';
import { unexpectedError } from '@/utils/unexpected-error';

interface FileInfo {
	id: string;
	type: string;
	title?: string;
	filename_download: string;
}

const props = withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		folder?: string;
	}>(),
	{
		value: null,
		disabled: false,
	},
);

const emit = defineEmits<{
	input: [value: string | null];
}>();

const { t } = useI18n();

const loading = ref(false);
const file = ref<FileInfo | null>(null);

const src = computed(() => {
	if (!file.value) return null;

	if (file.value.type?.includes('svg')) {
		return getAssetUrl(file.value.id);
	}

	if (file.value.type?.includes('image')) {
		return getAssetUrl(file.value.id, { imageKey: 'system-medium-contain' });
	}

	return null;
});

async function fetchFile() {
	if (!props.value) return;

	loading.value = true;

	try {
		const response = await api.get(`/files/${props.value}`, {
			params: {
				fields: ['id', 'title', 'type', 'filename_download'],
			},
		});

		file.value = response.data.data;
	} catch (error: any) {
		file.value = null;

		if (error.response?.status !== 403 && error.response?.status !== 404) {
			unexpectedError(error);
		}
	} finally {
		loading.value = false;
	}
}

function setFile(data: Record<string, any> | Record<string, any>[] | null) {
	if (!data) return;

	const fileData = Array.isArray(data) ? data[0] : data;
	if (!fileData) return;

	file.value = fileData as FileInfo;
	emit('input', fileData.id);
}

function deselect() {
	file.value = null;
	emit('input', null);
}

watch(
	() => props.value,
	(newValue, oldValue) => {
		if (newValue === oldValue) return;

		if (newValue) {
			fetchFile();
		} else {
			file.value = null;
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div class="system-file-image">
		<VSkeletonLoader v-if="loading" type="input-tall" />

		<div v-else-if="file && src" class="image-preview">
			<VImage :src="src" :alt="file.title || file.filename_download" />

			<div v-if="!disabled" class="actions">
				<VButton v-tooltip="t('deselect')" icon rounded x-small @click="deselect">
					<VIcon name="close" />
				</VButton>
			</div>
		</div>

		<VUpload v-else :disabled="disabled" from-library :folder="folder" @input="setFile" />
	</div>
</template>

<style lang="scss" scoped>
.system-file-image {
	width: 100%;
}

.image-preview {
	position: relative;
	width: 100%;
	height: var(--input-height-md);
	overflow: hidden;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
}

.actions {
	position: absolute;
	top: 8px;
	right: 8px;

	--v-button-color: var(--theme--foreground-subdued);
	--v-button-background-color: var(--white);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-background-color-hover: var(--white);

	opacity: 0;
	transition: opacity var(--fast) var(--transition);
}

.image-preview:hover .actions {
	opacity: 1;
}
</style>
