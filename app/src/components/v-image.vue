

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useAttrs, watch } from 'vue';
import { omit } from 'lodash';
import { requestQueue } from '@/api';

interface Props {
	src: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['error']);
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

async function loadImage() {
	try {
		requestQueue.add(async () => {
			srcData.value = props.src;
			return;
		});
	} catch (err) {
		emit('error', err);
	}
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

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
});
</script>

<template>
	<img ref="imageElement" :src="srcData" v-bind="attrsWithoutSrc" />
</template>
