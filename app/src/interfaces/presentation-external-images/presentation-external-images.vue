<template>
	<div class="presentation-external-images">
		<img v-for="(image, index) in images" :key="index" :src="image.src" :style="{ width: image.width ?? 'auto' }" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type Image = {
	src: string;
	width?: string;
};

export default defineComponent({
	props: {
		images: {
			type: Array as PropType<Image[]>,
			default: null,
		},
	},
});
</script>

<style lang="scss" scoped>
.presentation-external-images {
	display: inline-flex;
	flex-wrap: wrap;
	align-items: start;
	gap: 8px;
}
</style>
