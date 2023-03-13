<template>
	<div class="live-preview" :class="{[previewSize]: true}">
		<iframe id="frame" :src="url" frameborder="0" :width="size.width" :height="size.height"></iframe>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	previewSize: string;
	url: string
}

const props = defineProps<Props>();

const size = computed(() => {
	switch (props.previewSize) {
		case 'phone':
			return {width: '360px', height: '800px'};
		case 'tablet':
			return {width: '1280px', height: '800px'};
		default:
			return {width: '100%', height: '100%'};
	}
})

</script>

<style>
#split-content {
	background-color: var(--background-subdued);
}
</style>

<style scoped lang="scss">
.live-preview {
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;

	&.full {
		overflow: hidden;
	}
}
</style>
