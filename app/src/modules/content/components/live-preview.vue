<template>
	<div class="live-preview" >
		<iframe id="frame" src="http://nitwel.de" frameborder="0" :width="size.width" :height="size.height"></iframe>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	previewSize: string;
}

const props = defineProps<Props>();

const size = computed(() => {
	switch (props.previewSize) {
		case 'small':
			return {width: '100px', height: '100px'};
		case 'medium':
			return {width: '400px', height: '400px'};
		case 'large':
			return {width: '400px', height: '800px'};
		default:
			return {width: '100%', height: '100%'};
	}
})

</script>

<style scoped lang="scss">
.live-preview {
	width: 100%;
	height: 100%;
	overflow: auto;
}
</style>
