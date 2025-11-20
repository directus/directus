<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { computed } from 'vue';

const props = defineProps<{
	text: string;
	state: 'streaming' | 'done';
}>();

const open = defineModel<boolean>('open', { default: false });

const summaryText = computed(() => {
	const titleSentence = props.text.split('\n\n')[0];

	if (titleSentence) return titleSentence.replaceAll('**', '');

	return null;
});

const expandedText = computed(() => {
	const [, ...rest] = props.text.split('\n\n');
	return rest.join();
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
			<span v-md="summaryText || $t('ai.thinking')" class="reasoning-summary" :class="state" />
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
	font-size: 12px;
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
