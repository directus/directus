<script lang="ts" setup>
import SkipMenu from '../../components/skip-menu.vue';
import { AccordionRoot } from 'reka-ui';
import AiSidebarDetail from '@/ai/components/ai-sidebar-detail.vue';
import { useSidebarStore } from '../stores/sidebar';
import { ref, watch } from 'vue';

const sidebarStore = useSidebarStore();

const activeAccordionItem = ref<string>();

watch(activeAccordionItem, (newActiveItem) => {
	if (newActiveItem) sidebarStore.expand();
});

sidebarStore.onCollapse(() => {
	activeAccordionItem.value = undefined;
});
</script>

<template>
	<aside id="sidebar" ref="sidebarEl" role="contentinfo" class="alt-colors" aria-label="Module Sidebar">
		<SkipMenu section="sidebar" />
		<AccordionRoot v-model="activeAccordionItem" type="single" collapsible class="accordion-root">
			<slot name="sidebar" />
			<div class="spacer" />
			<ai-sidebar-detail class="ai-sidebar-detail" />
		</AccordionRoot>
	</aside>
</template>

<style scoped>
#sidebar {
	inline-size: 100%;
	block-size: 100%;
	position: relative;
	overflow: hidden;
	background-color: var(--theme--sidebar--background);
	font-family: var(--theme--sidebar--font-family);
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
	min-inline-size: 250px;

	/* Explicitly render the border outside of the width of the bar itself */
	box-sizing: content-box;
}

.accordion-root {
	block-size: calc(100% - 60px);
	display: flex;
	flex-direction: column;
}

.ai-sidebar-detail {
	position: absolute;
	inset-block-end: 0;
}
</style>
