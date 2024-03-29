<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useAttrs, watch } from 'vue';
import { omit } from 'lodash';
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

const observer = new IntersectionObserver((entries, observer) => {
	if (entries.length === 0) return;

	const isIntersecting = entries.at(-1)!.isIntersecting;

	if (isIntersecting && props.src) {
		observer.disconnect();
		loadImage();
	}
});

watch(
	() => props.src,
	() => loadImage(),
);

function loadImage() {
	requestQueue.add(() => {
		srcData.value = props.src;
	});
}

onMounted(() => {
	if (!imageElement.value) return;
	observer.observe(imageElement.value);
});

onUnmounted(() => {
	observer.disconnect();
});

const attrsWithoutSrc = computed(() => omit(attrs, ['src']));
</script>

<template>
	<img ref="imageElement" :src="srcData" v-bind="attrsWithoutSrc" />
</template>
