<script setup lang="ts">
import type { ContextAttachment } from '@directus/ai';
import type { DynamicToolUIPart, FileUIPart, UIMessagePart as SDKUIMessagePart, UIDataTypes, UITools } from 'ai';
import { computed } from 'vue';
import { useVisualElementHighlight } from '../composables/use-visual-element-highlight';
import AiContextCard from './ai-context-card.vue';
import AiMessageFileGroup from './parts/ai-message-file-group.vue';
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
	id?: string;
	role: 'user' | 'assistant' | 'system';
	parts?: AiMessagePart[];
	actions?: AiMessageAction[];
	metadata?: AiMessageMetadata;
}

const props = withDefaults(defineProps<Props>(), {
	parts: () => [],
});

const { highlight, clearHighlight } = useVisualElementHighlight();

function isToolPart(part: AiMessagePart): part is DynamicToolUIPart {
	return part.type.startsWith('tool-');
}

function isFilePart(part: AiMessagePart): part is FileUIPart {
	return part.type === 'file';
}

type RenderBlock =
	| { kind: 'part'; key: string; part: AiMessagePart }
	| { kind: 'file-group'; key: string; parts: FileUIPart[] };

const renderBlocks = computed<RenderBlock[]>(() => {
	const prefix = props.id ?? 'msg';

	return props.parts.reduce<RenderBlock[]>((blocks, part, i) => {
		if (isFilePart(part)) {
			const last = blocks.at(-1);

			if (last?.kind === 'file-group') {
				last.parts.push(part);
			} else {
				blocks.push({ kind: 'file-group', key: `${prefix}-files-${i}`, parts: [part] });
			}
		} else {
			blocks.push({ kind: 'part', key: `${prefix}-${part.type}-${i}`, part });
		}

		return blocks;
	}, []);
});
</script>

<template>
	<article :data-role="role" class="ai-message">
		<div class="message-content">
			<slot>
				<template v-for="block in renderBlocks" :key="block.key">
					<template v-if="block.kind === 'part'">
						<AiMessageText
							v-if="block.part.type === 'text'"
							:text="block.part.text"
							:state="block.part.state || 'done'"
							:role="role"
						/>
						<AiMessageReasoning
							v-else-if="block.part.type === 'reasoning' && (block.part.text || block.part.state === 'streaming')"
							:text="block.part.text"
							:state="block.part.state ?? 'done'"
						/>
						<AiMessageSourceUrl v-else-if="block.part.type === 'source-url'" :part="block.part" />
						<AiMessageSourceDocument v-else-if="block.part.type === 'source-document'" :part="block.part" />
						<AiMessageTool v-else-if="isToolPart(block.part)" :part="block.part" />
					</template>
					<AiMessageFileGroup v-else :parts="block.parts" />
				</template>
			</slot>

			<!-- Context attachments from metadata (user messages only) -->
			<div v-if="role === 'user' && metadata?.attachments?.length" class="context-attachments">
				<AiContextCard
					v-for="(attachment, index) in metadata.attachments"
					:key="`${attachment.type}-${index}`"
					:item="attachment"
					@mouseenter="highlight(attachment)"
					@mouseleave="clearHighlight()"
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
