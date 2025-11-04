<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';

defineProps<{
	text: string;
	state: 'streaming' | 'done';
}>();
</script>

<template>
	<CollapsibleRoot class="message-reasoning" :default-open="false">
		<CollapsibleTrigger class="reasoning-header">
			<v-icon name="psychology" x-small />
			<span>{{ state === 'streaming' ? 'Thinking...' : 'Reasoning' }}</span>
			<v-icon name="expand_more" x-small class="chevron" />
		</CollapsibleTrigger>
		<CollapsibleContent class="reasoning-content-wrapper">
			<div v-md="text || ''" class="reasoning-content" :data-state="state"></div>
		</CollapsibleContent>
	</CollapsibleRoot>
</template>

<style lang="scss" scoped>
.message-reasoning {
	margin: 0.25rem 0;

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

		.chevron {
			transition: transform 150ms ease;
		}

		&[data-state='open'] .chevron {
			transform: rotate(180deg);
		}
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
		padding-top: 0.5rem;
		padding-left: 1.25rem;
	}
}

@keyframes slideDown {
	from {
		height: 0;
	}

	to {
		height: var(--reka-collapsible-content-height);
	}
}

@keyframes slideUp {
	from {
		height: var(--reka-collapsible-content-height);
	}

	to {
		height: 0;
	}
}
</style>
