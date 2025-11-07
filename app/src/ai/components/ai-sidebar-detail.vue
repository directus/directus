<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import AiConversation from './ai-conversation.vue';
import AiHeader from './ai-header.vue';
</script>

<template>
	<CollapsibleRoot class="collapsible-root">
		<CollapsibleTrigger class="collapsible-trigger">
			<VIcon name="smart_toy" class="collapsible-trigger-icon" />
			<span>{{ $t('ai_chat') }}</span>
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
	padding-inline: 12px;
}

.collapsible-trigger-icon {
	margin-inline-end: 12px;
}

.collapsible-content {
	overflow: hidden;
}

.collapsible-content[data-state='open'] {
	animation: slide-down var(--slow) var(--transition);
	block-size: calc(100vh - 60px);
}

.collapsible-content[data-state='closed'] {
	animation: slide-up var(--slow) var(--transition);
	block-size: calc(100vh - 60px);
}

.ai-sidebar-content {
	padding: 12px;
	block-size: calc(100% - 24px);
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
