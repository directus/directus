<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import type { UIMessagePart, UIDataTypes, UITools } from 'ai';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAiStore } from '@/ai/stores/use-ai';
import formatTitle from '@directus/format-title';

const aiStore = useAiStore();

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

const toolName = computed(() => {
	return props.part.type.replace('tool-', '');
});

const toolDisplayName = computed(() => {
	const localTool = aiStore.localTools.find((t) => t.name === toolName.value);

	if (localTool) {
		return localTool.displayName;
	}

	return formatTitle(toolName.value);
});
</script>

<template>
	<CollapsibleRoot class="message-tool" :default-open="false">
		<CollapsibleTrigger class="tool-header">
			<p class="tool-name">
				<v-icon name="build" x-small left />
				<v-text-overflow :text="toolDisplayName" />
			</p>
			<div class="tool-status">
				<v-chip class="tool-status-chip" :class="statusConfig.class" x-small :label="false">
					<v-icon :name="statusConfig.icon" x-small />
					{{ statusConfig.label }}
				</v-chip>
				<v-icon name="expand_more" x-small class="chevron" />
			</div>
		</CollapsibleTrigger>
		<CollapsibleContent class="tool-content-wrapper">
			<v-notice v-if="'errorText' in part && part.state === 'output-error'" type="danger" class="tool-error" multiline>
				<template #title>
					{{ $t('ai.error_message') }}
				</template>
				<span>{{ part.errorText }}</span>
			</v-notice>
			<div v-if="'input' in part" class="tool-input">
				<p class="label">{{ $t('ai.input') }}</p>
				<code>{{ part.input }}</code>
			</div>
			<div v-if="'output' in part && part.state === 'output-available'" class="tool-output">
				<p class="label">{{ $t('ai.output') }}</p>
				<code>{{ part.output }}</code>
			</div>
		</CollapsibleContent>
	</CollapsibleRoot>
</template>

<style scoped>
.message-tool {
	inline-size: 100%;
	border-radius: var(--theme--border-radius);
	border: var(--theme--border-width) solid var(--theme--border-color-accent);
}

.tool-header {
	display: flex;
	align-items: center;
	padding: 0.5rem;
	justify-content: space-between;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	inline-size: 100%;

	&:hover {
		color: var(--theme--foreground-accent);
	}

	.chevron {
		margin-inline-start: auto;
		transition: transform var(--fast) var(--transition);
	}

	&[data-state='open'] .chevron {
		transform: rotate(180deg);
	}
}

.tool-name {
	display: inline-flex;
	align-items: center;
	overflow: hidden;
}

.tool-status {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
}

.tool-status-chip {
	.v-icon {
		margin-inline-end: 0.25rem;
		border: none;
	}

	border-width: 0;

	--v-chip-background-color: transparent;

	&.status-streaming {
		--v-chip-color: var(--theme--primary-foreground);
		--v-chip-border-color: var(--theme--primary);
	}

	&.status-ready {
		--v-chip-color: var(--theme--warning-accent);
		--v-chip-border-color: var(--theme--warning);
	}

	&.status-complete {
		--v-chip-color: var(--theme--success-accent);
		--v-chip-border-color: var(--theme--success);
	}

	&.status-error {
		--v-chip-color: var(--theme--danger-accent);
		--v-chip-border-color: var(--theme--danger);
	}

	&.status-unknown {
		--v-chip-color: var(--theme--foreground-subdued);
		--v-chip-border-color: var(--theme--foreground);
	}
}

.tool-content-wrapper {
	max-block-size: 280px;
	overflow-block: auto;
	padding-inline: 0.5rem;

	&[data-state='open'] {
		animation: slide-down 200ms ease-out;
	}

	&[data-state='closed'] {
		animation: slide-up 200ms ease-out;
	}

	& > * {
		margin-block-end: 0.5rem;
	}
}

.label {
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	margin-block: 0.5rem 0.25rem;
}

.tool-input,
.tool-output {
	padding: 0.5rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background);
	font-size: 0.875rem;
	line-height: 1.25;

	code {
		font-size: 0.75rem;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}
}

.tool-error {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5rem;
	margin-block-start: 0.5rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--danger-background);
	color: var(--theme--foreground);
	font-size: 0.875rem;
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
