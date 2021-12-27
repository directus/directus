<template>
	<img ref="imageElement" :src="inView ? srcData : emptyPixel" v-bind="attrsWithoutSrc" />
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { omit } from 'lodash';
import api from '@/api';

export default defineComponent({
	inheritAttrs: false,
	props: {
		src: {
			type: String,
			required: true,
		},
	},
	emits: ['error'],
	setup(props, { emit, attrs }) {
		const imageElement = ref<HTMLImageElement>();

		const inView = ref(false);

		const emptyPixel =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
		const srcData = ref<string>(emptyPixel);
		const queued = ref(true);

		const observer = new IntersectionObserver((entries) => {
			if (entries.length === 0) return;
			inView.value = entries[0].isIntersecting;
		});

		watch(
			() => props.src,
			async () => {
				try {
					const res = await api.get(props.src, { responseType: 'arraybuffer' });
					const data = new Uint8Array(res.data);
					const raw = String.fromCharCode.apply(null, data);
					const base64 = btoa(raw);
					srcData.value = `data:image;base64,${base64}`;
				} catch (err) {
					emit('error', err);
				}
			},
			{ immediate: true }
		);

		onMounted(() => {
			if (!imageElement.value) return;
			observer.observe(imageElement.value);
		});

		onUnmounted(() => {
			observer.disconnect();
		});

		const attrsWithoutSrc = computed(() => omit(attrs, ['src']));

		return { queued, srcData, attrsWithoutSrc, imageElement, inView, emptyPixel };
	},
});
</script>
