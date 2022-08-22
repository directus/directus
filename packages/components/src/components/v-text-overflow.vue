<template>
	<div ref="el" v-tooltip:[placement]="hasEllipsis && text" class="v-text-overflow">
		<v-highlight v-if="highlight" :query="highlight" :text="text" />
		<template v-else>{{ text }}</template>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useElementSize } from '@directus/shared/composables';

interface Props {
	/** The text that should be displayed */
	text: string | number | boolean | Record<string, any> | Array<any>;
	/** What parts of the text should be highlighted */
	highlight?: string;
	/** The placement of the tooltip */
	placement?: 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';
}

withDefaults(defineProps<Props>(), {
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
	{ immediate: true }
);
</script>

<style lang="scss" scoped>
.v-text-overflow {
	overflow: hidden;
	line-height: normal;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
