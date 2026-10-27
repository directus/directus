<script setup lang="ts">
import type { File } from '@directus/types';
import { VisuallyHidden } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VUpload from '@/components/v-upload.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import { unexpectedError } from '@/utils/unexpected-error';

type FileInfo = Pick<File, 'id' | 'type' | 'title' | 'filename_download'>;

const props = withDefaults(
	defineProps<{
		value?: string | null;
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
const imageError = ref(false);
const file = ref<FileInfo | null>(null);
const imageAccept = 'image/*';
const imageFilter = { type: { _starts_with: 'image/' } };

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

async function fetchFile(id: string) {
	loading.value = true;

	try {
		const response = await api.get(`/files/${id}`, {
			params: {
				fields: ['id', 'title', 'type', 'filename_download'],
			},
		});

		if (props.value === id) {
			file.value = response.data.data;
		}
	} catch (error: any) {
		if (props.value !== id) return;

		file.value = null;

		if (error.response?.status !== 403 && error.response?.status !== 404) {
			unexpectedError(error);
		}
	} finally {
		if (props.value === id) {
			loading.value = false;
		}
	}
}

function setFile(data: File | File[] | null) {
	if (!data) return;

	const fileData = Array.isArray(data) ? data[0] : data;
	if (!fileData) return;

	imageError.value = false;
	file.value = fileData;
	emit('input', fileData.id);
}

function deselect() {
	file.value = null;
	emit('input', null);
}

watch(
	() => props.value,
	(newValue) => {
		imageError.value = false;

		if (newValue) {
			fetchFile(newValue);
		} else {
			file.value = null;
			loading.value = false;
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div class="system-file-image">
		<VSkeletonLoader v-if="loading" type="input-tall" />

		<div v-else-if="value || file" class="image-preview">
			<VImage
				v-if="file && src && !imageError"
				:src="src"
				:alt="file.title || file.filename_download"
				@error="imageError = true"
			/>
			<div v-else class="image-error">
				<VIcon name="hide_image" />
				<span>{{ t('interfaces.system-file-image.image_unavailable') }}</span>
			</div>

			<div v-if="!disabled" class="actions">
				<VButton v-tooltip="t('deselect')" icon x-small @click="deselect">
					<VisuallyHidden :aria-hidden="false">{{ t('deselect') }}</VisuallyHidden>
					<VIcon name="close" aria-hidden="true" />
				</VButton>
			</div>
		</div>

		<VUpload
			v-else
			:disabled="disabled"
			from-library
			:folder="folder"
			:accept="imageAccept"
			:filter="imageFilter"
			@input="setFile"
		/>
	</div>
</template>

<style lang="scss" scoped>
.system-file-image {
	inline-size: 100%;
}

.image-preview {
	position: relative;
	inline-size: 100%;
	block-size: var(--input-height-md);
	overflow: hidden;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);

	img {
		inline-size: 100%;
		block-size: 100%;
		object-fit: contain;
	}
}

.image-error {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	block-size: 100%;
	color: var(--theme--foreground-subdued);
}

.actions {
	position: absolute;
	inset-block-start: 0.5rem;
	inset-inline-end: 0.5rem;

	--v-button-color: var(--theme--foreground-subdued);
	--v-button-background-color: var(--theme--background);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-background-color-hover: var(--theme--background);

	opacity: 0;
	transition: opacity var(--fast) var(--transition);
}

.image-preview:hover .actions,
.image-preview:focus-within .actions,
.image-preview:has(.image-error) .actions {
	opacity: 1;
}
</style>
