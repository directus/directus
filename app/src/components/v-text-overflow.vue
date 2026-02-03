<script setup lang="ts">
import { useElementSize } from '@directus/composables';
import { ref, watch } from 'vue';
import VHighlight from '@/components/v-highlight.vue';

interface Props {
	/** The text that should be displayed */
	text?: string | number | boolean | Record<string, any> | Array<any>;
	/** What parts of the text should be highlighted */
	highlight?: string;
	/** The placement of the tooltip */
	placement?: 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';
}

withDefaults(defineProps<Props>(), {
	text: undefined,
	highlight: undefined,
	placement: 'top',
});

const el = ref<HTMLElement>();
const hasEllipsis = ref(false);

const { width } = useElementSize(el);

watch(
	width,
	() => {
		if (!el.value) return;
		hasEllipsis.value = el.value.offsetWidth < el.value.scrollWidth;
	},
	{ immediate: true },
);
</script>

<template>
	<div ref="el" v-tooltip:[placement]="hasEllipsis && text" class="v-text-overflow">
		<VHighlight v-if="highlight" :query="highlight" :text="text" />
		<template v-else>{{ text }}</template>
	</div>
</template>

<style lang="scss" scoped>
.v-text-overflow {
	overflow: hidden;
	line-height: normal;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
