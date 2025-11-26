<script setup lang="ts">
import type { UIMessagePart, UIDataTypes, UITools } from 'ai';
import { computed } from 'vue';
import { useAiStore } from '@/ai/stores/use-ai';
import formatTitle from '@directus/format-title';
import AiToolCallCard from './ai-tool-call-card.vue';

const aiStore = useAiStore();

const props = defineProps<{
	part: Extract<UIMessagePart<UIDataTypes, UITools>, { type: `tool-${string}` }>;
}>();

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

const state = computed(
	() =>
		props.part.state as
			| 'input-streaming'
			| 'input-available'
			| 'approval-requested'
			| 'output-available'
			| 'output-error',
);

const approval = computed(() => (props.part as any).approval);
</script>

<template>
	<AiToolCallCard
		:state="state"
		:approval="approval"
		:tool-name="toolName"
		:default-open="state === 'approval-requested'"
	>
		<template #title>
			<v-text-overflow :text="toolDisplayName" />
		</template>
		<template #error>
			<v-notice v-if="'errorText' in part && part.state === 'output-error'" type="danger" class="tool-error" multiline>
				<template #title>
					{{ $t('ai.error_message') }}
				</template>
				<span>{{ part.errorText }}</span>
			</v-notice>
		</template>
		<template #content>
			<div v-if="'input' in part && part.input" class="tool-input">
				<p class="label">{{ $t('ai.input') }}</p>
				<code>{{ part.input }}</code>
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
</style>
