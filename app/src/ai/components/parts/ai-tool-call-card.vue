<script setup lang="ts">
import { useAiStore } from '@/ai/stores/use-ai';
import { translateShortcut } from '@/utils/translate-shortcut';
import { onKeyStroke } from '@vueuse/core';
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const aiStore = useAiStore();
const { t } = useI18n();

const props = defineProps<{
	state: 'input-streaming' | 'input-available' | 'approval-requested' | 'output-available' | 'output-error';
	approval?: { id: string };
	toolName: string;
	icon?: string;
	defaultOpen?: boolean;
}>();

const isStreaming = computed(() => props.state === 'input-streaming' || props.state === 'input-available');
const isApprovalRequested = computed(() => props.state === 'approval-requested');
const shouldBeOpen = computed(() => props.state === 'approval-requested' || props.defaultOpen);

const statusConfig = computed(() => {
	switch (props.state) {
		case 'input-streaming':
			return { icon: 'pending', label: t('ai.streaming'), class: 'status-streaming' };
		case 'input-available':
			return { icon: 'hourglass_empty', label: t('ai.ready'), class: 'status-ready' };
		case 'approval-requested':
			return { icon: 'help_outline', label: t('ai.approval_requested'), class: 'status-approval' };
		case 'output-available':
			return { icon: 'check_circle', label: t('ai.complete'), class: 'status-complete' };
		case 'output-error':
			return { icon: 'error', label: t('ai.error'), class: 'status-error' };
		default:
			return { icon: 'help', label: t('ai.unknown'), class: 'status-unknown' };
	}
});

const handleApprove = () => {
	if (props.approval?.id) {
		aiStore.approveToolCall(props.approval.id);
	}
};

const handleDeny = () => {
	if (props.approval?.id) {
		aiStore.denyToolCall(props.approval.id);
	}
};

const handleAlwaysAllow = () => {
	aiStore.setToolApprovalMode(props.toolName, 'always');

	if (props.approval?.id) {
		aiStore.approveToolCall(props.approval.id);
	}
};

onKeyStroke('Enter', (e) => {
	if (!isApprovalRequested.value) return;
	e.preventDefault();

	if (e.metaKey) {
		handleAlwaysAllow();
	} else {
		handleApprove();
	}
});

onKeyStroke('Escape', (e) => {
	if (!isApprovalRequested.value) return;
	e.preventDefault();
	handleDeny();
});
</script>

<template>
	<CollapsibleRoot class="tool-call-card" :default-open="shouldBeOpen" :disabled="isApprovalRequested">
		<CollapsibleTrigger
			class="card-header"
			:class="{ 'is-disabled': isApprovalRequested }"
			:disabled="isApprovalRequested"
		>
			<div class="card-title" :class="{ streaming: isStreaming }">
				<v-icon :name="icon || 'build'" x-small />
				<slot name="title" />
			</div>
			<div class="card-meta">
				<span v-if="isStreaming" class="card-status">
					<v-progress-circular indeterminate x-small />
				</span>
				<slot v-else name="status">
					<v-chip class="status-chip" :class="statusConfig.class" x-small :label="false">
						<v-icon :name="statusConfig.icon" x-small />
						{{ statusConfig.label }}
					</v-chip>
				</slot>
				<v-icon v-if="!isApprovalRequested" name="expand_more" x-small class="chevron" />
			</div>
		</CollapsibleTrigger>

		<div class="card-body" :class="{ 'has-approval': isApprovalRequested }">
			<CollapsibleContent class="card-content">
				<slot name="error" />
				<slot name="content" />
			</CollapsibleContent>
			<div v-if="isApprovalRequested" class="card-approval-actions">
				<p class="approval-message">{{ t('ai.approve_tool_execution') }}</p>
				<div class="approval-buttons">
					<v-button x-small danger @click="handleDeny">
						{{ t('ai.deny') }}
						<span class="keyboard-hint">Esc</span>
					</v-button>
					<v-button x-small outlined @click="handleAlwaysAllow">
						{{ t('ai.always_allow') }}
						<span class="keyboard-hint">{{ translateShortcut(['meta', 'enter']) }}</span>
					</v-button>
					<v-button x-small @click="handleApprove">
						{{ t('ai.approve') }}
						<span class="keyboard-hint">{{ translateShortcut(['enter']) }}</span>
					</v-button>
				</div>
			</div>
		</div>
	</CollapsibleRoot>
</template>

<style scoped>
.tool-call-card {
	inline-size: 100%;
	border-radius: var(--theme--border-radius);
	border: var(--theme--border-width) solid var(--theme--border-color-accent);
}

.card-header {
	display: flex;
	align-items: center;
	padding: 0.5rem;
	justify-content: space-between;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	inline-size: 100%;

	&:not(.is-disabled):hover {
		color: var(--theme--foreground-accent);
	}

	&.is-disabled {
		cursor: default;
		pointer-events: none;
	}

	.chevron {
		margin-inline-start: auto;
		transition: transform var(--fast) var(--transition);
	}

	&[data-state='open'] .chevron {
		transform: rotate(180deg);
	}
}

.card-title {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	overflow: hidden;

	&.streaming :deep(span),
	&.streaming :deep(.v-text-overflow) {
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

.card-meta {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	flex-shrink: 0;
}

.card-status {
	display: inline-flex;
	align-items: center;
}

.status-chip {
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

	&.status-approval {
		--v-chip-color: var(--theme--warning-accent);
		--v-chip-border-color: var(--theme--warning-background);
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

.card-body {
	display: flex;
	flex-direction: column;

	&.has-approval {
		.card-content {
			max-block-size: 200px;
		}
	}
}

.card-content {
	max-block-size: 280px;
	overflow-y: auto;
	padding-inline: 0.5rem;

	&[data-state='open'] {
		animation: slide-down 200ms ease-out forwards;
	}

	&[data-state='closed'] {
		animation: slide-up 200ms ease-out;
	}

	& > * {
		margin-block-end: 0.5rem;
	}
}

.card-approval-actions {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	border-block-start: 1px solid var(--theme--border-color-subdued);
	background-color: var(--theme--background-normal);
	position: sticky;
	inset-block-end: 0;

	.approval-message {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--theme--foreground);
	}

	.approval-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: flex-end;

		.v-button {
			position: relative;

			.keyboard-hint {
				margin-inline-start: 0.5rem;
				font-size: 0.75rem;
				opacity: 0.6;
				font-weight: 500;
			}
		}
	}
}

@keyframes slide-down {
	0% {
		block-size: 0;
		overflow-y: hidden;
	}

	99.9% {
		overflow-y: hidden;
	}

	100% {
		block-size: var(--reka-collapsible-content-height);
		overflow-y: auto;
	}
}

@keyframes slide-up {
	0% {
		block-size: var(--reka-collapsible-content-height);
	}

	100% {
		block-size: 0;
	}
}
</style>
