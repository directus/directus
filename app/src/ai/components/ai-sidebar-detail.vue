<script setup lang="ts">
import { ref } from 'vue';
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';
import { useShortcut } from '@/composables/use-shortcut';
import { useAiStore } from '../stores/use-ai';
import { translateShortcut } from '@/utils/translate-shortcut';
import VIcon from '@/components/v-icon/v-icon.vue';
import AiConversation from './ai-conversation.vue';
import AiHeader from './ai-header.vue';

const sidebarStore = useSidebarStore();
const aiStore = useAiStore();

const aiSidebarDetailRef = ref<HTMLElement | undefined>(undefined);

useShortcut('meta+j', () => {
	aiStore.chatOpen = !aiStore.chatOpen;
});
</script>

<template>
	<CollapsibleRoot
		ref="aiSidebarDetailRef"
		v-model:open="aiStore.chatOpen"
		v-tooltip.left="!aiStore.chatOpen && `${$t('ai_chat')} (${translateShortcut(['meta', 'j'])})`"
		class="collapsible-root"
	>
		<CollapsibleTrigger class="collapsible-trigger">
			<VIcon name="magic_button" class="collapsible-trigger-icon" />
			<span v-show="!sidebarStore.collapsed" class="collapsible-trigger-title">{{ $t('ai_chat') }}</span>
			<VIcon v-show="!sidebarStore.collapsed" name="chevron_left" class="collapsible-trigger-chevron" />
		</CollapsibleTrigger>
		<CollapsibleContent class="collapsible-content">
			<div class="ai-sidebar-content">
				<ai-header />
				<ai-conversation />
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
	block-size: 60px;
	inline-size: 100%;
	background-color: var(--theme--sidebar--section--toggle--background);
	color: var(--theme--sidebar--section--toggle--foreground);
	display: flex;
	align-items: center;
	padding-inline: 18px 9px;
	transition: color var(--fast) var(--transition);

	&:hover:not([data-state='open']){
		color: var(--theme--primary);
		animation: colors 2s ease infinite alternate;
	}
}

.collapsible-trigger-icon {
	margin-inline-end: 12px;
}

.collapsible-trigger-title {
	flex-grow: 1;
	text-align: start;
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
	padding: 12px 0 12px 12px;
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

@keyframes colors {
	0% {
		filter: hue-rotate(0);
	}
	50% {
		filter: hue-rotate(90deg);
	}
	100% {
		filter: hue-rotate(180deg);
	}
}
</style>
