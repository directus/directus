<script setup lang="ts">
import { useElementHover } from '@vueuse/core';
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { useTemplateRef } from 'vue';
import { useAiStore } from '../stores/use-ai';
import AiConversation from './ai-conversation.vue';
import AiMagicButton from './ai-magic-button.vue';
import VChip from '@/components/v-chip.vue';
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
		<CollapsibleTrigger class="collapsible-trigger">
			<div ref="collapsible-trigger-content" class="collapsible-trigger-content">
				<AiMagicButton class="collapsible-trigger-icon" :animate="hovering" />
				<span v-show="!sidebarStore.collapsed" class="collapsible-trigger-title">{{ $t('ai_assistant') }}</span>
				<VChip v-show="!sidebarStore.collapsed" outlined primary x-small class="collapsible-trigger-beta">
					{{ $t('beta') }}
				</VChip>
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

<style scoped>
.collapsible-root {
	inline-size: 100%;
	background-color: var(--theme--sidebar--background);
}

.collapsible-trigger {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	block-size: 60px;
	inline-size: 100%;
}

.collapsible-trigger-content {
	block-size: 100%;
	inline-size: 100%;
	background-color: var(--theme--sidebar--section--toggle--background);
	color: var(--theme--sidebar--section--toggle--foreground);
	display: flex;
	align-items: center;
	padding-inline: 18px 9px;
	transition: color var(--fast) var(--transition);
}

.collapsible-trigger-icon {
	margin-inline-end: 12px;
}

.collapsible-trigger-title {
	flex-grow: 1;
	text-align: start;
}

.collapsible-trigger-beta {
	margin-inline-end: 8px;
	color: var(--theme--primary);
	border-color: var(--theme--primary);
}

.collapsible-trigger-chevron {
	color: var(--theme--foreground-subdued);
	transform: rotate(0deg);
	transition: transform var(--fast) var(--transition);
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
	block-size: calc(100vh - 60px);
}

.collapsible-content[data-state='closed'] {
	animation: slide-up var(--fast) var(--transition);
	block-size: calc(100vh - 60px);
}

.ai-sidebar-content {
	padding: 12px;
	block-size: 100%;
	display: flex;
	flex-direction: column;
}

@keyframes slide-down {
	from {
		block-size: 0;
	}
	to {
		block-size: calc(100vh - 60px);
	}
}

@keyframes slide-up {
	from {
		block-size: calc(100vh - 60px);
	}
	to {
		block-size: 0;
	}
}
</style>
