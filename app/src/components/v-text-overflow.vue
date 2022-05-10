<template>
	<div ref="el" v-tooltip:[placement]="hasEllipsis && tooltip" class="v-text-overflow">
		<v-highlight v-if="highlight" :query="highlight" :text="text" />
		<template v-else>{{ text }}</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue';
import { useElementSize } from '@/composables/use-element-size';

export default defineComponent({
	props: {
		text: {
			type: [String, Number, Array, Object, Boolean],
			required: true,
		},
		highlight: {
			type: String,
			default: null,
		},
		placement: {
			type: String,
			default: 'top',
			validator: (val: string) => ['top', 'bottom', 'left', 'right', 'start', 'end'].includes(val),
		},
		tooltipPrefix: {
			type: String,
			default: null,
		},
		tooltipSuffix: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const el = ref<HTMLElement>();
		const hasEllipsis = ref(false);

		const { width } = useElementSize(el);

		watch(
			width,
			() => {
				if (!el.value) return;
				hasEllipsis.value = el.value.offsetWidth < el.value.scrollWidth;
			},
			{ immediate: true }
		);

		const tooltip = computed(() => {
			const prefix = props.tooltipPrefix ?? '';
			const suffix = props.tooltipSuffix ?? '';

			return `${prefix}${props.text}${suffix}`;
		});

		return { el, hasEllipsis, tooltip };
	},
});
</script>

<style lang="scss" scoped>
.v-text-overflow {
	overflow: hidden;
	line-height: normal;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
