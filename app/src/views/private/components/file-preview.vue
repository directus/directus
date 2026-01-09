<script setup lang="ts">
import type { File } from '@directus/types';
import { computed, toRef } from 'vue';
import VIconFile from '@/components/v-icon-file.vue';
import VImage from '@/components/v-image.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import { readableMimeType } from '@/utils/readable-mime-type';

export interface Props {
	file: Pick<File, 'id' | 'title' | 'type' | 'modified_on' | 'width' | 'height'>;
	preset?: string | null;
	inModal?: boolean;
}

const props = withDefaults(defineProps<Props>(), { preset: 'system-large-contain' });

defineEmits<{
	click: [];
}>();

const file = toRef(props, 'file');

const src = computed(() =>
	getAssetUrl(file.value.id, {
		imageKey: props.preset ?? undefined,
		cacheBuster: file.value.modified_on,
	}),
);

const type = computed<'image' | 'video' | 'audio' | string>(() => {
	const mimeType = file.value.type;

	if (mimeType === null) return 'unknown';

	if (mimeType.startsWith('image')) {
		return 'image';
	}

	if (mimeType.startsWith('video')) {
		return 'video';
	}

	if (mimeType.startsWith('audio')) {
		return 'audio';
	}

	return readableMimeType(mimeType, true) ?? 'unknown';
});

const isSVG = computed(() => file.value.type?.includes('svg'));

const maxHeight = computed(() => (props.inModal ? '85vh' : Math.min(file.value.height ?? 528, 528) + 'px'));
const isSmall = computed(() => file.value.height && file.value.height < 528);
</script>

<template>
	<div class="file-preview" :class="{ modal: inModal, small: isSmall, svg: isSVG }" @click="$emit('click')">
		<div v-if="type === 'image'" class="image">
			<VImage :src="src" :width="file.width" :height="file.height" :alt="file.title" />
		</div>

		<div v-else-if="type === 'video'" class="video">
			<video controls :src="src" />
		</div>

		<audio v-else-if="type === 'audio'" controls :src="src" />

		<div v-else class="fallback">
			<VIconFile :ext="type" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.file-preview {
	position: relative;
	max-inline-size: calc((var(--form-column-max-width) * 2) + var(--theme--form--column-gap));

	img,
	video {
		inline-size: auto;
		block-size: auto;
	}

	audio {
		inline-size: 100%;
	}

	img,
	video,
	audio {
		max-inline-size: 100%;
		max-block-size: v-bind(maxHeight);
		object-fit: contain;
		border-radius: var(--theme--border-radius);
	}

	.image,
	.video {
		background-color: var(--theme--background-normal);
		border-radius: var(--theme--border-radius);
	}

	.image {
		img {
			z-index: 1;
			display: block;
			margin: 0 auto;
		}
	}

	.video {
		display: flex;
		justify-content: center;

		video {
			min-block-size: 80px;
			min-inline-size: 80px;
		}
	}

	.fallback {
		background-color: var(--theme--background-normal);
		display: flex;
		align-items: center;
		justify-content: center;
		block-size: var(--input-height-md);
		border-radius: var(--theme--border-radius);
	}

	&.svg,
	&.small {
		.image {
			padding: 64px;
		}
	}

	&.modal {
		display: flex;
		justify-content: center;
		align-items: center;

		img,
		video {
			background-color: transparent;
			border-radius: 0;
		}
	}
}
</style>
