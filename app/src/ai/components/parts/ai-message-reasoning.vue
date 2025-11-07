<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { computed } from 'vue';

const props = defineProps<{
	text: string | string[];
	state: 'streaming' | 'done';
}>();

const open = defineModel<boolean>('open', { default: false });

const textContent = computed(() => {
	return Array.isArray(props.text) ? (props.text[0] ?? '') : (props.text ?? '');
});

const boldMatch = computed(() => textContent.value.match(/\*\*(.+?)\*\*/));

const summaryText = computed(() => {
	// Extract first bold text: **title**
	if (boldMatch.value?.[1]) return boldMatch.value[1].trim();

	const text = textContent.value;

	// Fallback: first sentence (up to . ! ? ; : — or newline)
	const sentenceMatch = text.match(/^([^.\n!?;:—]+)/);
	if (sentenceMatch?.[1]) return sentenceMatch[1].trim();

	// Last fallback: truncate to 50 chars
	return text.slice(0, 50).trim() + (text.length > 50 ? '...' : '');
});

const expandedText = computed(() => {
	// Strip the bold summary from the expanded content
	return boldMatch.value
		? textContent.value.replace(/\*\*[^*]+\*\*\s*/, '').trim()
		: textContent.value;
});
</script>

<template>
	<CollapsibleRoot v-model:open="open" class="message-reasoning">
		<CollapsibleTrigger class="reasoning-header" :aria-label="$t('ai.thinking')">
			<v-icon
				:name="state === 'streaming' ? 'lightbulb' : 'check_circle'"
				:aria-label="state === 'streaming' ? $t('ai.thinking') : $t('ai.complete')"
				x-small
			/>
			<span class="reasoning-summary" :class="state">{{ summaryText || $t('ai.thinking') }}</span>
			<v-icon name="expand_more" x-small class="chevron" aria-hidden="true" />
		</CollapsibleTrigger>
		<CollapsibleContent class="reasoning-content-wrapper">
			<div v-md="expandedText" class="reasoning-content"></div>
		</CollapsibleContent>
	</CollapsibleRoot>
</template>

<style scoped>
.message-reasoning {
	margin: 0.25rem 0;
}

.reasoning-header {
	display: inline-flex;
	align-items: start;
	text-align: start;
	gap: 0.375rem;
	font-size: rem;
	font-weight: 500;
	color: var(--theme--foreground);

	.v-icon {
		margin-block-start: 5px;
	}

	&:hover {
		color: var(--theme--foreground-accent);
	}

	&[data-state='open'] .chevron {
		transform: rotate(180deg);
	}
}

.chevron {
	transition: transform var(--fast) var(--transition);
}

.reasoning-summary {
	display: inline-block;

	&.streaming {
		background:
			linear-gradient(
				90deg,
				transparent calc(50% - var(--spread, 40px)),
				var(--theme--foreground),
				transparent calc(50% + var(--spread, 40px))
			),
			linear-gradient(var(--theme--foreground-subdued), var(--theme--foreground-subdued));
		background-size:
			250% 100%,
			auto;
		background-clip: text;
		background-repeat: no-repeat;
		-webkit-text-fill-color: transparent;
		animation: shimmer 2s linear infinite;
	}
}

@keyframes shimmer {
	from {
		background-position:
			100% center,
			0 0;
	}

	to {
		background-position:
			0% center,
			0 0;
	}
}

.reasoning-content-wrapper {
	overflow: hidden;

	&[data-state='open'] {
		animation: slide-down var(--medium) var(--transition-out);
	}

	&[data-state='closed'] {
		animation: slide-up var(--medium) var(--transition-out);
	}
}

.reasoning-content {
	font-size: 12px;
	color: var(--theme--foreground-normal);
	padding-inline-start: 12px;
	padding-block: 4px;
	line-height: 1.6;
	margin-inline-start: 4px;
	border-inline-start: var(--theme--border-width) solid var(--theme--border-color-accent);
}

@keyframes slide-down {
	from {
		block-size: 0;
	}
	to {
		block-size: var(--reka-collapsible-content-height);
	}
}

@keyframes slide-up {
	from {
		block-size: var(--reka-collapsible-content-height);
	}
	to {
		block-size: 0;
	}
}
</style>
