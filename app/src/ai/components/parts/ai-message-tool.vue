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
			<span class="tool-name">{{ part.type.replace('tool-', '') }}</span>
			<div class="tool-status" :class="statusConfig.class">
				<v-icon :name="statusConfig.icon" x-small />
				<span class="status-label">{{ statusConfig.label }}</span>
			</div>
			<v-icon name="expand_more" x-small class="chevron" />
		</CollapsibleTrigger>
		<CollapsibleContent class="tool-content-wrapper">
			<div v-if="'input' in part" class="tool-input">
				<div class="label">Input:</div>
				<code>{{ part.input }}</code>
			</div>
			<div v-if="'output' in part && part.state === 'output-available'" class="tool-output">
				<div class="label">Output:</div>
				<code>{{ part.output }}</code>
			</div>
			<div v-if="'errorText' in part && part.state === 'output-error'" class="tool-error">
				<v-icon name="error" x-small />
				<span>{{ part.errorText }}</span>
			</div>
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
	width: 100%;

	&:hover {
		opacity: 0.8;
	}

	.chevron {
		margin-left: auto;
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
	margin-bottom: 0.25rem;
	margin-top: 0.5rem;
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
	margin-top: 0.5rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--danger);
	color: var(--white);
	font-size: 0.875rem;
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
