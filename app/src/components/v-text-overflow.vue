<template>
	<div class="v-text-overflow" ref="el" v-tooltip="hasEllipsis && text">
		{{ text }}
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import { useElementSize } from '@/composables/use-element-size';

export default defineComponent({
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	setup() {
		const el = ref<HTMLElement>();
		const hasEllipsis = ref(false);

		const { width } = useElementSize(el);

		watch(
			width,
			() => {
				console.log(width.value);
				if (!el.value) return;
				hasEllipsis.value = el.value.offsetWidth < el.value.scrollWidth;
			},
			{ immediate: true }
		);

		return { el, hasEllipsis };
	},
});
</script>

<style lang="scss" scoped>
.v-text-overflow {
	overflow: hidden;
	line-height: 1.1;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
