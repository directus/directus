<template>
	<div class="media-player">
		<component
			:is="type"
			v-if="type"
			ref="mediaElement"
			class="video-js vjs-big-play-centered media-player-theme"
			:style="styleOverrides"
			v-bind="attrsWithoutSrc"
		></component>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { omit } from 'lodash';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';

export default defineComponent({
	inheritAttrs: false,
	props: {
		src: {
			type: String,
			required: true,
		},
		mime: {
			type: String,
			required: true,
		},
		options: {
			type: Object,
			default: () => ({}),
		},
		height: {
			type: String,
			default: undefined,
		},
		width: {
			type: String,
			default: undefined,
		},
		maxHeight: {
			type: String,
			default: undefined,
		},
		maxWidth: {
			type: String,
			default: undefined,
		},
	},
	emits: ['error'],
	setup(props, { attrs }) {
		const mediaElement = ref<HTMLElement>();
		const mediaPlayer = ref<VideoJsPlayer>();

		const defaultOptions = {
			autoplay: false,
			controls: true,
			fluid: true,
			muted: false,
			preload: 'none',
			sources: [
				{
					src: props.src,
					type: props.mime,
				},
			],
			plugins: {},
		};

		const type = computed<'video' | 'audio' | null>(() => {
			if (props.mime === null) return null;

			if (props.mime.startsWith('video')) {
				return 'video';
			}

			if (props.mime.startsWith('audio')) {
				return 'audio';
			}

			return null;
		});

		const videoOptions = computed<VideoJsPlayerOptions>(() => {
			const mergedOptions = Object.assign({}, defaultOptions, props.options);

			return mergedOptions;
		});

		const styleOverrides = computed(() => {
			return {
				'--media-player-width': props.width,
				'--media-player-height': props.height,
				'--media-player-max-width': props.maxWidth,
				'--media-player-max-height': props.maxHeight,
			};
		});

		onMounted(() => {
			if (!mediaElement.value) return;
			mediaPlayer.value = videojs(mediaElement.value, videoOptions.value);
		});

		const attrsWithoutSrc = computed(() => omit(attrs, ['src']));

		return { mediaElement, type, styleOverrides, attrsWithoutSrc };
	},
});
</script>

<style>
@import 'video.js/dist/video-js.min.css';
@import './theme.css';
</style>

<style lang="scss" scoped>
.video-js.vjs-fluid:not(.vjs-fullscreen) {
	width: var(--media-player-width);
	max-width: var(--media-player-max-width);
	height: var(--media-player-height);
	min-height: 100px;
	max-height: var(--media-player-max-height);
	padding-top: 0 !important;
	line-height: 0;

	video.vjs-tech {
		position: relative !important;
		max-width: var(--media-player-max-width);
		max-height: var(--media-player-max-height);
	}

	.vjs-control-bar {
		line-height: 1;
	}
}
</style>
