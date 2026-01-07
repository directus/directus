<script lang="ts" setup>
import { AccordionRoot } from 'reka-ui';
import { useSidebarStore } from '../stores/sidebar';
import AiSidebarDetail from '@/ai/components/ai-sidebar-detail.vue';

const sidebarStore = useSidebarStore();
</script>

<template>
	<aside role="contentinfo" class="sidebar alt-colors" aria-label="Module Sidebar">
		<AccordionRoot v-model="sidebarStore.activeAccordionItem" type="single" collapsible class="accordion-root">
			<slot name="sidebar" />
			<AiSidebarDetail class="ai-sidebar-detail" />
		</AccordionRoot>
	</aside>
</template>

<style scoped>
.sidebar {
	inline-size: 100%;
	block-size: 100%;
	position: relative;
	overflow: hidden;
	background-color: var(--theme--sidebar--background);
	font-family: var(--theme--sidebar--font-family);
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
	min-inline-size: 280px;

	/* Explicitly render the border outside of the width of the bar itself */
	box-sizing: content-box;
}

.accordion-root {
	/* 60px leaves space for the the AI toggle at the bottom */
	block-size: calc(100% - 60px);
	display: flex;
	flex-direction: column;
}

.ai-sidebar-detail {
	position: absolute;
	inset-block-end: 0;
	z-index: 2;
}
</style>
