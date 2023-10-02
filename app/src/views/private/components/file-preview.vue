<script setup lang="ts">
import { addTokenToURL } from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { readableMimeType } from '@/utils/readable-mime-type';
import type { File } from '@directus/types';
import { computed, ref, toRef } from 'vue';

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
const imgError = ref(false);

const src = computed(
	() => `assets/${file.value.id}?cache-buster=${file.value.modified_on}${props.preset ? `&key=${props.preset}` : ''}`
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

const authenticatedSrc = computed(() => addTokenToURL(getRootPath() + src.value));
</script>

<template>
	<div class="file-preview" :class="{ modal: inModal, small: isSmall, svg: isSVG }" @click="$emit('click')">
		<div v-if="type === 'image' && !imgError" class="image">
			<v-image :src="src" :width="file.width" :height="file.height" :alt="file.title" @error="imgError = true" />
		</div>

		<div v-else-if="type === 'video'" class="video">
			<video controls :src="authenticatedSrc" />
		</div>

		<audio v-else-if="type === 'audio'" controls :src="authenticatedSrc" />

		<div v-else class="fallback">
			<v-icon-file :ext="type" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.file-preview {
	position: relative;
	max-width: calc((var(--form-column-max-width) * 2) + var(--form-horizontal-gap));

	img,
	video {
		width: auto;
		height: auto;
	}

	audio {
		width: 100%;
	}

	img,
	video,
	audio {
		max-width: 100%;
		max-height: v-bind(maxHeight);
		object-fit: contain;
		border-radius: var(--border-radius);
	}

	.image,
	.video {
		background-color: var(--background-normal);
		border-radius: var(--border-radius);
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
			min-height: 80px;
			min-width: 80px;
		}
	}

	.fallback {
		background-color: var(--background-normal);
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--input-height-tall);
		border-radius: var(--border-radius);
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
