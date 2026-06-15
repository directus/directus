<script setup lang="ts">
import { useElementHover } from '@vueuse/core';
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { useTemplateRef } from 'vue';
import { useAiStore } from '../stores/use-ai';
import AiConversation from './ai-conversation.vue';
import AiMagicButton from './ai-magic-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';

const sidebarStore = useSidebarStore();
const aiStore = useAiStore();

const aiSidebarCollapsibleTriggerContent = useTemplateRef('collapsible-trigger-content');

const hovering = useElementHover(aiSidebarCollapsibleTriggerContent);
</script>

<template>
	<CollapsibleRoot
		v-model:open="aiStore.chatOpen"
		v-tooltip.left="sidebarStore.collapsed && $t('ai_assistant')"
		class="collapsible-root"
	>
		<CollapsibleTrigger class="collapsible-trigger" :class="{ active: aiStore.chatOpen }">
			<div ref="collapsible-trigger-content" class="collapsible-trigger-content">
				<AiMagicButton class="collapsible-trigger-icon" :animate="hovering" />
				<span v-show="!sidebarStore.collapsed" class="collapsible-trigger-title">{{ $t('ai_assistant') }}</span>
				<VIcon v-show="!sidebarStore.collapsed" name="chevron_left" class="collapsible-trigger-chevron" />
			</div>
		</CollapsibleTrigger>
		<CollapsibleContent class="collapsible-content">
			<div class="ai-sidebar-content">
				<AiConversation />
			</div>
		</CollapsibleContent>
	</CollapsibleRoot>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.collapsible-root {
	--ai-sidebar-open-height: calc(100vh - var(--sidebar-section-trigger-height));

	@include mixins.breakpoint-up('sm') {
		--ai-sidebar-open-height: calc(100vh - var(--sidebar-section-trigger-height) - var(--header-bar-height));
	}

	inline-size: 100%;
	background-color: var(--theme--sidebar--background);
}

.collapsible-trigger {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	block-size: var(--sidebar-section-trigger-height);
	inline-size: 100%;
}

.collapsible-trigger-content {
	@include mixins.sidebar-section-trigger(
		$chevron-selector: '.collapsible-trigger-chevron',
		$active-parent-selector: '.collapsible-trigger.active'
	);

	block-size: 100%;
	inline-size: 100%;
}

.collapsible-trigger-icon {
	@include mixins.sidebar-section-trigger-icon;

	block-size: var(--sidebar-section-trigger-icon-size);
	inline-size: var(--sidebar-section-trigger-icon-size);
}

.collapsible-trigger-title {
	@include mixins.sidebar-section-trigger-title;
}

.collapsible-trigger-chevron {
	@include mixins.sidebar-section-trigger-chevron;

	transition-property: transform, color;
}

.collapsible-trigger[data-state='open'] {
	.collapsible-trigger-chevron {
		transform: rotate(-90deg);
	}

	border-block-end: var(--theme--sidebar--section--toggle--border-width) solid
		var(--theme--sidebar--section--toggle--border-color);
}

.collapsible-trigger[data-state='closed'] {
	border-block-start: var(--theme--sidebar--section--toggle--border-width) solid
		var(--theme--sidebar--section--toggle--border-color);
}

.collapsible-content {
	overflow: hidden;
}

.collapsible-content[data-state='open'] {
	animation: slide-down var(--fast) var(--transition);
	block-size: var(--ai-sidebar-open-height);
}

.collapsible-content[data-state='closed'] {
	animation: slide-up var(--fast) var(--transition);
	block-size: var(--ai-sidebar-open-height);
}

.ai-sidebar-content {
	padding: 0 var(--sidebar-section-content-padding) var(--sidebar-section-content-padding);
	block-size: 100%;
	display: flex;
	flex-direction: column;
}

@keyframes slide-down {
	from {
		block-size: 0;
	}
	to {
		block-size: var(--ai-sidebar-open-height);
	}
}

@keyframes slide-up {
	from {
		block-size: var(--ai-sidebar-open-height);
	}
	to {
		block-size: 0;
	}
}
</style>
