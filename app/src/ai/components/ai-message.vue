<script setup lang="ts">
import type { ContextAttachment } from '@directus/ai';
import type { DynamicToolUIPart, UIMessagePart as SDKUIMessagePart, UIDataTypes, UITools } from 'ai';
import { useAiStore } from '../stores/use-ai';
import AiContextCard from './ai-context-card.vue';
import AiMessageFile from './parts/ai-message-file.vue';
import AiMessageReasoning from './parts/ai-message-reasoning.vue';
import AiMessageSourceDocument from './parts/ai-message-source-document.vue';
import AiMessageSourceUrl from './parts/ai-message-source-url.vue';
import AiMessageText from './parts/ai-message-text.vue';
import AiMessageTool from './parts/ai-message-tool.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

export type AiMessagePart = SDKUIMessagePart<UIDataTypes, UITools>;

export interface AiMessageAction {
	icon: string;
	label: string;
	onClick?: (event: MouseEvent) => void;
	disabled?: boolean;
	loading?: boolean;
}

export interface AiMessageMetadata {
	attachments?: ContextAttachment[];
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
	/** Message metadata including context attachments */
	metadata?: AiMessageMetadata;
}

withDefaults(defineProps<Props>(), {
	parts: () => [],
});

const aiStore = useAiStore();

const isToolPart = (part: AiMessagePart): part is DynamicToolUIPart => part.type.startsWith('tool-');

function handleMouseEnter(attachment: ContextAttachment) {
	if (attachment.type === 'visual-element') {
		aiStore.highlightVisualElement({
			collection: attachment.data.collection,
			item: attachment.data.item,
			fields: attachment.data.fields,
		});
	}
}

function handleMouseLeave(attachment: ContextAttachment) {
	if (attachment.type === 'visual-element') {
		aiStore.highlightVisualElement(null);
	}
}
</script>

<template>
	<article :data-role="role" class="ai-message">
		<div class="message-content">
			<slot>
				<template
					v-for="(part, index) in parts"
					:key="`${id}-${part.type}-${index}-${'state' in part ? `-${part.state}` : ''}`"
				>
					<AiMessageText v-if="part.type === 'text'" :text="part.text" :state="part.state || 'done'" :role="role" />
					<AiMessageReasoning
						v-else-if="part.type === 'reasoning' && (part.text || part.state === 'streaming')"
						:text="part.text"
						:state="part.state ?? 'done'"
					/>
					<AiMessageFile v-else-if="part.type === 'file'" :part="part" />
					<AiMessageSourceUrl v-else-if="part.type === 'source-url'" :part="part" />
					<AiMessageSourceDocument v-else-if="part.type === 'source-document'" :part="part" />
					<AiMessageTool v-else-if="isToolPart(part)" :part="part" />
				</template>
			</slot>

			<!-- Context attachments from metadata (user messages only) -->
			<div v-if="role === 'user' && metadata?.attachments?.length" class="context-attachments">
				<AiContextCard
					v-for="(attachment, index) in metadata.attachments"
					:key="`${attachment.type}-${index}`"
					:item="attachment"
					@mouseenter="handleMouseEnter(attachment)"
					@mouseleave="handleMouseLeave(attachment)"
				/>
			</div>

			<div v-if="actions && actions.length > 0" class="message-actions">
				<VButton
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
					<VIcon :name="action.icon" small />
				</VButton>
			</div>
		</div>
	</article>
</template>

<style scoped>
/*
  Available Variables:
  --ai-message-background       [role-based]
  --ai-message-color            [role-based]
  --ai-message-border-radius    [var(--theme--border-radius)]
  --ai-message-parts-gap        [0.75rem]
*/

.ai-message {
	display: flex;
	gap: var(--ai-message-parts-gap, 0.75rem);
	align-items: flex-start;
	max-inline-size: 100%;

	&[data-role='assistant'] {
		--ai-message-color: var(--theme--foreground);

		justify-content: flex-start;
	}

	&[data-role='user'] {
		--ai-message-background: var(--theme--background);
		--ai-message-color: var(--theme--foreground);

		justify-content: flex-end;
		margin-inline-start: 24px;
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
}

.context-attachments {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}
</style>
