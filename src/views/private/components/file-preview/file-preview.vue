<template>
	<div class="file-preview" v-if="type">
		<div v-if="type === 'image'" class="image" :class="{ svg: isSVG }">
			<img :src="src" :width="width" :height="height" :alt="title" />
		</div>

		<video v-else-if="type === 'video'" controls :src="src" />

		<audio v-else-if="type === 'audio'" controls :src="src" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		mime: {
			type: String,
			required: true,
		},
		width: {
			type: Number,
			default: null,
		},
		height: {
			type: Number,
			default: null,
		},
		src: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const type = computed<'image' | 'video' | 'audio' | null>(() => {
			if (props.mime === null) return null;

			if (props.mime.startsWith('image')) {
				return 'image';
			}

			if (props.mime.startsWith('video')) {
				return 'video';
			}

			if (props.mime.startsWith('audio')) {
				return 'audio';
			}

			return null;
		});

		const isSVG = computed(() => props.mime.includes('svg'));

		return { type, isSVG };
	},
});
</script>

<style lang="scss" scoped>
.file-preview {
	position: relative;
	width: 100%;
	height: 100%;
}

.image {
	width: 100%;
	height: 100%;
}

.svg {
	padding: 64px;
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);
}

img,
video,
audio {
	width: 100%;
	height: 100%;
	max-height: 100%;
	object-fit: contain;
}
</style>
