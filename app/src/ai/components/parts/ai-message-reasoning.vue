<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { ref, watch } from 'vue';

const props = defineProps<{
	text: string;
	state: 'streaming' | 'done';
}>();

const isOpen = ref(props.state === 'streaming');

watch(
	() => props.state,
	(newState, oldState) => {
		if (oldState === 'streaming' && newState === 'done') {
			isOpen.value = false;
		} else if (newState === 'streaming') {
			isOpen.value = true;
		}
	},
);
</script>

<template>
	<CollapsibleRoot v-model:open="isOpen" class="message-reasoning">
		<CollapsibleTrigger class="reasoning-header">
			<v-icon name="psychology" x-small />
			<span>{{ state === 'streaming' ? $t('ai.thinking') : $t('ai.reasoning') }}</span>
			<v-icon name="expand_more" x-small class="chevron" />
		</CollapsibleTrigger>
		<CollapsibleContent class="reasoning-content-wrapper">
			<div v-md="text || ''" class="reasoning-content" :data-state="state"></div>
		</CollapsibleContent>
	</CollapsibleRoot>
</template>

<style scoped>
.message-reasoning {
	margin: 0.25rem 0;
}

.reasoning-header {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--theme--foreground);
	cursor: pointer;
	user-select: none;
	background: none;
	border: none;
	padding: 0;

	&:hover {
		color: var(--theme--foreground-accent);
	}

	&[data-state='open'] .chevron {
		transform: rotate(180deg);
	}
}

.chevron {
	transition: transform 150ms ease;
}

.reasoning-content-wrapper {
	overflow: hidden;

	&[data-state='open'] {
		animation: slideDown 200ms ease-out;
	}

	&[data-state='closed'] {
		animation: slideUp 200ms ease-out;
	}
}

.reasoning-content {
	font-size: 0.875rem;
	opacity: 0.7;
	padding-block-start: 0.5rem;
	padding-inline-start: 1.25rem;
}

@keyframes slideDown {
	from {
		block-size: 0;
	}
	to {
		block-size: var(--reka-collapsible-content-height);
	}
}

@keyframes slideUp {
	from {
		block-size: var(--reka-collapsible-content-height);
	}
	to {
		block-size: 0;
	}
}
</style>
