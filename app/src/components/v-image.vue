<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';
import { omit } from 'lodash-es';
import { computed, ref, useAttrs, watch } from 'vue';
import { requestQueue } from '@/api';

defineOptions({
	inheritAttrs: false,
});

interface Props {
	src: string;
}

const props = defineProps<Props>();
const attrs = useAttrs();

const imageElement = ref<HTMLImageElement>();

const emptyPixel =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const srcData = ref<string>(emptyPixel);

let stopObserver = () => {};

const observer = useIntersectionObserver(imageElement, (entries) => {
	const isIntersecting = entries.at(-1)?.isIntersecting ?? false;

	if (isIntersecting && props.src) {
		stopObserver();
		loadImage();
	}
});

stopObserver = observer.stop;

watch(
	() => props.src,
	() => loadImage(),
);

function loadImage() {
	requestQueue.add(() => {
		srcData.value = props.src;
	});
}

const attrsWithoutSrc = computed(() => omit(attrs, ['src']));
</script>

<template>
	<img ref="imageElement" :src="srcData" v-bind="attrsWithoutSrc" />
</template>
