<script setup lang="ts">
import formatTitle from '@directus/format-title';
import type { DynamicToolUIPart } from 'ai';
import { computed } from 'vue';
import AiAskUserSummary from './ai-ask-user-summary.vue';
import AiToolCallCard from './ai-tool-call-card.vue';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import VNotice from '@/components/v-notice.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

const toolsStore = useAiToolsStore();

const props = defineProps<{
	part: DynamicToolUIPart;
}>();

const isExecute = computed(() => props.part.type === 'tool-execute');

// Directus tools run through the root `execute` tool, so the real identity (and the
// key approvals are stored under) lives in `input.name`, not the `tool-execute` part type.
const innerToolName = computed(() => {
	const input = props.part.input as { name?: unknown } | undefined;
	return isExecute.value && typeof input?.name === 'string' ? input.name : undefined;
});

const toolName = computed(() => innerToolName.value ?? props.part.type.replace('tool-', ''));

// Unwrap the inner args for execute calls so the card shows the actual input instead of
// the `{ name, input }` wrapper.
const displayInput = computed(() => {
	const input = (props.part as { input?: unknown }).input;

	if (isExecute.value && input && typeof input === 'object' && 'input' in input) {
		return (input as { input?: unknown }).input;
	}

	return input;
});

const toolDisplayName = computed(() => {
	const localTool = toolsStore.localTools.find((t) => t.name === toolName.value);

	if (localTool) {
		return localTool.displayName;
	}

	return formatTitle(toolName.value);
});

const state = computed(
	() =>
		props.part.state as
			| 'input-streaming'
			| 'input-available'
			| 'approval-requested'
			| 'output-available'
			| 'output-error',
);

const approval = computed(() => props.part.approval as { id: string; approved?: boolean; reason?: string } | undefined);

const isAskUser = computed(() => toolName.value === 'ask_user');
</script>

<template>
	<AiToolCallCard v-if="isAskUser && state === 'output-available'" :state="state" :tool-name="toolName">
		<template #title>
			<VTextOverflow :text="toolDisplayName" />
		</template>
		<template #content>
			<AiAskUserSummary :part="part" />
		</template>
	</AiToolCallCard>
	<template v-else-if="isAskUser && state !== 'output-error'" />

	<AiToolCallCard v-else :state="state" :approval="approval" :tool-name="toolName">
		<template #title>
			<VTextOverflow :text="toolDisplayName" />
		</template>
		<template #error>
			<VNotice v-if="'errorText' in part && part.state === 'output-error'" type="danger" class="tool-error" multiline>
				<template #title>
					{{ $t('ai.error_message') }}
				</template>
				<span>{{ part.errorText }}</span>
			</VNotice>
		</template>
		<template #content>
			<div v-if="displayInput" class="tool-input">
				<p class="label">{{ $t('ai.input') }}</p>
				<code>{{ displayInput }}</code>
			</div>
			<div v-if="'output' in part && part.output && part.state === 'output-available'" class="tool-output">
				<p class="label">{{ $t('ai.output') }}</p>
				<code>{{ part.output }}</code>
			</div>
		</template>
	</AiToolCallCard>
</template>

<style scoped>
.label {
	font-size: 0.5625rem;
	font-weight: 600;
	text-transform: uppercase;
	margin-block: 0.375rem 0.1875rem;
}

.tool-input,
.tool-output {
	padding: 0.375rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background);
	font-size: 0.6875rem;
	line-height: 1.25;

	code {
		font-size: 0.5625rem;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}
}

.tool-error {
	display: flex;
	align-items: center;
	gap: 0.3125rem;
	padding: 0.375rem;
	margin-block-start: 0.375rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--danger-background);
	color: var(--theme--foreground);
	font-size: 0.6875rem;
}
</style>
