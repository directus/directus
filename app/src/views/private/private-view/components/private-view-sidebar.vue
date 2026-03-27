<script lang="ts" setup>
import { AccordionRoot } from 'reka-ui';
import { useSidebarStore } from '../stores/sidebar';
import AiSidebarDetail from '@/ai/components/ai-sidebar-detail.vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();
const sidebarStore = useSidebarStore();
</script>

<template>
	<aside role="contentinfo" class="sidebar alt-colors" aria-label="Module Sidebar">
		<AccordionRoot
			v-model="sidebarStore.activeAccordionItem"
			type="single"
			collapsible
			class="accordion-root"
			:class="{ 'ai-disabled': !serverStore.info.ai_enabled }"
		>
			<slot name="sidebar" />
		</AccordionRoot>
		<AiSidebarDetail v-if="serverStore.info.ai_enabled" class="ai-sidebar-detail" />
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
	min-inline-size: 15.75rem;

	/* Border set by parent; hidden on mobile */
}

.accordion-root {
	block-size: calc(100% - var(--sidebar-section-trigger-height));
	overflow-y: auto;
	display: block;
}

.accordion-root.ai-disabled {
	block-size: 100%;
}

.ai-sidebar-detail {
	position: absolute;
	inset-block-end: 0;
	z-index: 2;
}
</style>
