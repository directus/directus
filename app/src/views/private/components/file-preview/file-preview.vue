<template>
	<div v-if="type && !imgError" class="file-preview" :class="{ modal: inModal, small: isSmall, svg: isSVG }">
		<div v-if="type === 'image'" class="image" @click="$emit('click')">
			<img :src="src" :width="width" :height="height" :alt="title" @error="imgError = true" />
		</div>

		<video v-else-if="type === 'video'" controls :src="src" />

		<audio v-else-if="type === 'audio'" controls :src="src" />

		<div v-else class="fallback">
			<v-icon-file :ext="type" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { readableMimeType } from '@/utils/readable-mime-type';

interface Props {
	mime: string;
	width?: number;
	height?: number;
	src: string;
	title: string;
	inModal?: boolean;
}

defineEmits(['click']);

const props = withDefaults(defineProps<Props>(), { width: undefined, height: undefined, inModal: false });

const imgError = ref(false);

const type = computed<'image' | 'video' | 'audio' | string>(() => {
	if (props.mime === null) return 'unknown';

	if (props.mime.startsWith('image')) {
		return 'image';
	}

	if (props.mime.startsWith('video')) {
		return 'video';
	}

	if (props.mime.startsWith('audio')) {
		return 'audio';
	}

	return readableMimeType(props.mime, true) ?? 'unknown';
});

const isSVG = computed(() => props.mime.includes('svg'));

const maxHeight = computed(() => Math.min(props.height ?? 528, 528) + 'px');
const isSmall = computed(() => props.height < 528);
</script>

<style lang="scss" scoped>
.file-preview {
	position: relative;
	max-width: calc((var(--form-column-max-width) * 2) + var(--form-horizontal-gap));

	img,
	video,
	audio {
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: v-bind(maxHeight);
		object-fit: contain;
		border-radius: var(--border-radius);
	}

	.image {
		background-color: var(--background-normal);
		border-radius: var(--border-radius);

		img {
			z-index: 1;
			display: block;
			margin: 0 auto;
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
		.image {
			background-color: transparent;
			border-radius: 0;
		}
	}
}
</style>
