<script setup lang="ts">
import type { UIMessagePart as SDKUIMessagePart, UIDataTypes, DynamicToolUIPart, UITools } from 'ai';

import AiMessageFile from './parts/ai-message-file.vue';
import AiMessageReasoning from './parts/ai-message-reasoning.vue';
import AiMessageSourceDocument from './parts/ai-message-source-document.vue';
import AiMessageSourceUrl from './parts/ai-message-source-url.vue';
import AiMessageText from './parts/ai-message-text.vue';
import AiMessageTool from './parts/ai-message-tool.vue';

// Alias for SDK message parts - component handles text/reasoning/file parts
export type AiMessagePart = SDKUIMessagePart<UIDataTypes, UITools>;

export interface AiMessageAction {
	icon: string;
	label: string;
	onClick?: (event: MouseEvent) => void;
	disabled?: boolean;
	loading?: boolean;
}

interface Props {
	/** Message ID for tracking */
	id?: string;
	/** Message role */
	role: 'user' | 'assistant' | 'system';
	/** Message parts for structured content */
	parts?: AiMessagePart[];
	/** Action buttons displayed below message */
	actions?: AiMessageAction[];
}

withDefaults(defineProps<Props>(), {
	parts: () => [],
});
</script>

<template>
	<article :data-role="role" class="ai-message">
		<div class="message-content">
			<slot>
				<template
					v-for="(part, index) in parts"
					:key="`${id}-${part.type}-${index}-${'state' in part ? `-${part.state}` : ''}`"
				>
					<AiMessageText v-if="part.type === 'text'" :text="part.text" :state="part.state || 'done'" />
					<AiMessageReasoning v-else-if="part.type === 'reasoning'" :text="part.text" :state="part.state ?? 'done'" />
					<AiMessageFile v-else-if="part.type === 'file'" :part="part" />
					<AiMessageSourceUrl v-else-if="part.type === 'source-url'" :part="part" />
					<AiMessageSourceDocument v-else-if="part.type === 'source-document'" :part="part" />
					<AiMessageTool v-else-if="part.type.startsWith('tool-')" :part="part as DynamicToolUIPart" />
				</template>
			</slot>
		</div>

		<div v-if="actions && actions.length > 0" class="message-actions">
			<v-button
				v-for="(action, index) in actions"
				:key="index"
				v-tooltip="action.label"
				x-small
				icon
				secondary
				:disabled="action.disabled"
				:loading="action.loading"
				@click="action.onClick?.($event)"
			>
				<v-icon :name="action.icon" small />
			</v-button>
		</div>
	</article>
</template>

<style scoped>
/*
  Available Variables:
  --ai-message-background       [role-based]
  --ai-message-color            [role-based]
  --ai-message-border-radius    [var(--theme--border-radius)]
  --ai-message-gap              [0.75rem]
*/

.ai-message {
	display: flex;
	gap: var(--ai-message-gap, 0.75rem);
	align-items: flex-start;
	max-inline-size: 100%;

	&:hover .message-actions {
		opacity: 1;
	}

	&[data-role='assistant'] {
		--ai-message-background: var(--theme--background-subdued);
		--ai-message-color: var(--theme--foreground);

		justify-content: flex-start;
		margin-inline-end: 12px;
	}

	&[data-role='user'] {
		--ai-message-background: var(--theme--primary);
		--ai-message-color: var(--theme--background);

		justify-content: flex-end;
		margin-inline-start: 12px;
		flex-direction: row-reverse;

		.message-content {
			align-items: flex-end;
		}
	}
}

.message-content {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	flex: 1;
	min-inline-size: 0;
}

.message-content :deep(.message-reasoning + .message-reasoning) {
	margin-block-start: -0.5rem;
}

.message-actions {
	display: flex;
	gap: 0.25rem;
	align-items: center;
	margin-block-start: 0.25rem;
	opacity: 0;
	transition: opacity var(--fast) var(--transition);
}
</style>
