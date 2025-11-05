<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import type { UIMessagePart, UIDataTypes, UITools } from 'ai';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	part: Extract<UIMessagePart<UIDataTypes, UITools>, { type: `tool-${string}` }>;
}>();

const { t } = useI18n();

const statusConfig = computed(() => {
	switch (props.part.state) {
		case 'input-streaming':
			return { icon: 'pending', label: t('ai.streaming'), class: 'status-streaming' };
		case 'input-available':
			return { icon: 'hourglass_empty', label: t('ai.ready'), class: 'status-ready' };
		case 'output-available':
			return { icon: 'check_circle', label: t('ai.complete'), class: 'status-complete' };
		case 'output-error':
			return { icon: 'error', label: t('ai.error'), class: 'status-error' };
		default:
			return { icon: 'help', label: t('ai.unknown'), class: 'status-unknown' };
	}
});
</script>

<template>
	<CollapsibleRoot class="message-tool" :default-open="false">
		<CollapsibleTrigger class="tool-header">
			<v-icon name="build" x-small />
			<p class="tool-name">{{ part.type.replace('tool-', '') }}</p>
			<p class="tool-status" :class="statusConfig.class">
				<v-icon :name="statusConfig.icon" x-small />
				<span class="status-label">{{ statusConfig.label }}</span>
			</p>
			<v-icon name="expand_more" x-small class="chevron" />
		</CollapsibleTrigger>
		<CollapsibleContent class="tool-content-wrapper">
			<div v-if="'input' in part" class="tool-input">
				<p class="label">{{ $t('ai.input') }}</p>
				<code>{{ part.input }}</code>
			</div>
			<div v-if="'output' in part && part.state === 'output-available'" class="tool-output">
				<p class="label">{{ $t('ai.output') }}</p>
				<code>{{ part.output }}</code>
			</div>
			<p v-if="'errorText' in part && part.state === 'output-error'" class="tool-error">
				<v-icon name="error" x-small />
				<span>{{ part.errorText }}</span>
			</p>
		</CollapsibleContent>
	</CollapsibleRoot>
</template>

<style scoped>
.message-tool {
	margin: 0.5rem 0;
	padding: 0.75rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color-subdued);
}

.tool-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	user-select: none;
	background: none;
	border: none;
	padding: 0;
	inline-size: 100%;

	&:hover {
		background-color: var(--theme--background-normal);
	}

	.chevron {
		margin-inline-start: auto;
		transition: transform 150ms ease;
	}

	&[data-state='open'] .chevron {
		transform: rotate(180deg);
	}
}

.tool-name {
	flex-shrink: 0;
}

.tool-status {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.5rem;
	border-radius: 1rem;
	font-size: 0.75rem;
	font-weight: 500;

	&.status-streaming {
		background-color: color-mix(in srgb, var(--theme--primary) 15%, transparent);
		color: var(--theme--primary);
	}

	&.status-ready {
		background-color: color-mix(in srgb, var(--theme--warning) 15%, transparent);
		color: var(--theme--warning);
	}

	&.status-complete {
		background-color: color-mix(in srgb, var(--theme--success) 15%, transparent);
		color: var(--theme--success);
	}

	&.status-error {
		background-color: color-mix(in srgb, var(--theme--danger) 15%, transparent);
		color: var(--theme--danger);
	}

	&.status-unknown {
		background-color: color-mix(in srgb, var(--theme--foreground) 10%, transparent);
		opacity: 0.6;
	}
}

.status-label {
	font-size: 0.75rem;
}

.tool-content-wrapper {
	overflow: hidden;

	&[data-state='open'] {
		animation: slideDown 200ms ease-out;
	}

	&[data-state='closed'] {
		animation: slideUp 200ms ease-out;
	}
}

.label {
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	opacity: 0.7;
	margin-block: 0.5rem 0.25rem;
}

.tool-input,
.tool-output {
	padding: 0.5rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background);
	font-size: 0.875rem;

	code {
		white-space: pre-wrap;
		word-break: break-word;
	}
}

.tool-error {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5rem;
	margin-block-start: 0.5rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--danger);
	color: var(--white);
	font-size: 0.875rem;
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
