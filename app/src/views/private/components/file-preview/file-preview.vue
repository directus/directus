<template>
	<div class="file-preview" v-if="type">
		<div
			v-if="type === 'image'"
			class="image"
			:class="{ svg: isSVG, 'max-size': inModal === false }"
			@click="$emit('click')"
		>
			<img
				:src="src"
				:width="width"
				:height="height"
				:style="{
					maxWidth: width ? width + 'px' : '100%',
				}"
				:alt="title"
			/>
			<v-icon v-if="inModal === false" name="upload" />
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
		inModal: {
			type: Boolean,
			default: false,
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
	max-width: calc((var(--form-column-max-width) * 2) + var(--form-horizontal-gap));
	height: 100%;
	margin-bottom: var(--form-vertical-gap);
}

img,
video,
audio {
	width: 100%;
	max-height: 100%;
	object-fit: contain;
	border-radius: var(--border-radius);
}

.image {
	width: 100%;
	height: 100%;
	cursor: pointer;

	&.max-size {
		max-height: 75vh;
		background-color: var(--background-normal);
		border-radius: var(--border-radius);
	}

	img {
		z-index: 1;
		display: block;
		max-height: inherit;
		margin: 0 auto;
	}

	.v-icon {
		position: absolute;
		right: 12px;
		bottom: 12px;
		z-index: 2;
		color: white;
		text-shadow: 0px 0px 8px rgba(0, 0, 0, 0.75);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	&:hover {
		.v-icon {
			opacity: 1;
		}
	}
}

.svg {
	padding: 64px;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);

	&.max-size img {
		// Max height - padding * 2
		max-height: calc(75vh - 128px);
	}
}
</style>
