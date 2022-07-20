<template>
	<div class="media-player">
		<component
			:is="type"
			v-if="type"
			ref="mediaElement"
			class="video-js vjs-big-play-centered media-player-theme"
			v-bind="attrsWithoutSrc"
		/>
	</div>
</template>

<script lang="ts" setup>
import { omit } from 'lodash';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import { computed, onMounted, ref, useAttrs } from 'vue';

interface Props {
	src: string;
	mime: string;
}

const props = defineProps<Props>();
const attrs = useAttrs();

const mediaElement = ref<HTMLElement>();
const mediaPlayer = ref<VideoJsPlayer>();

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

onMounted(() => {
	if (!mediaElement.value) return;
	mediaPlayer.value = videojs(mediaElement.value, {
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
	});
});

const attrsWithoutSrc = computed(() => omit(attrs, ['src']));
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
});
</script>
