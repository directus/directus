<script setup lang="ts">
import { computed } from 'vue';

export interface AiMessagePart {
	type: 'text' | 'image' | 'tool-call' | 'tool-result';
	text?: string;
	[key: string]: any;
}

export interface AiMessageAction {
	icon: string;
	label: string;
	onClick?: (event: MouseEvent) => void;
	disabled?: boolean;
	loading?: boolean;
}

export interface AiMessageAvatar {
	src?: string;
	icon?: string;
	alt?: string;
}

interface Props {
	/** Message ID for tracking */
	id?: string;
	/** Message role */
	role: 'user' | 'assistant' | 'system';
	/** @deprecated Use `parts` instead for structured content */
	content?: string;
	/** Message parts for structured content */
	parts?: AiMessagePart[];
	/** Visual variant using Directus theme colors */
	variant?: 'primary' | 'subdued' | 'accent' | 'normal';
	/** Message alignment side */
	side?: 'left' | 'right';
	/** Avatar configuration */
	avatar?: AiMessageAvatar;
	/** Action buttons displayed below message */
	actions?: AiMessageAction[];
	/** Compact mode for dense layouts */
	compact?: boolean;
	/** Message timestamp */
	timestamp?: Date | string;
}

const props = withDefaults(defineProps<Props>(), {
	parts: () => [],
	variant: 'subdued',
	side: 'left',
	compact: false,
});

const hasContent = computed(() => {
	return props.content || props.parts.length > 0;
});

const hasLeading = computed(() => {
	return !!props.avatar?.icon || !!props.avatar?.src;
});
</script>

<template>
	<article :data-role="role" :data-side="side" :data-variant="variant" :class="['ai-message', { compact }]">
		<div class="message-container">
			<div v-if="hasLeading" class="message-leading">
				<v-avatar :x-small="compact" :small="!compact">
					<v-image v-if="avatar?.src" :src="avatar.src" :alt="avatar?.alt || `${role} avatar`" />
					<v-icon v-else-if="avatar?.icon" :name="avatar.icon" />
					<v-icon v-else :name="role === 'user' ? 'person' : 'smart_toy'" />
				</v-avatar>
			</div>

			<div v-if="hasContent" class="message-content">
				<slot name="content">
					<div v-if="content" v-md="content" class="message-text"></div>
					<template v-else>
						<template v-for="(part, index) in parts" :key="`${id}-${part.type}-${index}`">
							<div v-if="part.type === 'text'" v-md="part.text || ''" class="message-text"></div>
							<div v-else-if="part.type === 'image'" class="message-image">
								<!-- Future: handle image rendering -->
								<span>{{ part }}</span>
							</div>
							<div v-else class="message-part">
								<!-- Future: handle other part types -->
								<span>{{ part }}</span>
							</div>
						</template>
					</template>
				</slot>
			</div>

			<div v-if="actions && actions.length > 0" class="message-actions">
				<v-tooltip v-for="(action, index) in actions" :key="index" :text="action.label">
					<v-button
						x-small
						icon
						secondary
						:disabled="action.disabled"
						:loading="action.loading"
						@click="action.onClick?.($event)"
					>
						<v-icon :name="action.icon" small />
					</v-button>
				</v-tooltip>
			</div>
		</div>
	</article>
</template>

<style lang="scss" scoped>
/*
  Available Variables:
  --ai-message-background       [variant-based]
  --ai-message-color            [variant-based]
  --ai-message-border-radius    [var(--theme--border-radius)]
  --ai-message-padding          [1rem]
  --ai-message-max-width        [80%]
  --ai-message-gap              [0.75rem]
*/

.ai-message {
	display: flex;
	width: 100%;

	&[data-side='right'] {
		justify-content: flex-end;

		.message-container {
			flex-direction: row-reverse;
		}

		.message-content {
			align-items: flex-end;
		}
	}

	&[data-side='left'] {
		justify-content: flex-start;
	}
}

.message-container {
	display: flex;
	gap: var(--ai-message-gap, 0.75rem);
	align-items: flex-start;
	max-width: var(--ai-message-max-width, 80%);
}

.message-leading {
	flex-shrink: 0;
}

.message-content {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
}

.message-text {
	padding: var(--ai-message-padding, 1rem);
	border-radius: var(--ai-message-border-radius, var(--theme--border-radius));
	background-color: var(--ai-message-background, var(--theme--background-subdued));
	color: var(--ai-message-color, var(--theme--foreground));
	word-wrap: break-word;
	overflow-wrap: break-word;

	:deep(p) {
		margin: 0;

		& + p {
			margin-top: 0.5rem;
		}
	}

	:deep(code) {
		background-color: color-mix(in srgb, currentColor 10%, transparent);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-family: var(--theme--fonts--monospace--font-family, 'Monaco', monospace);
		font-size: 0.875em;
	}

	:deep(pre) {
		background-color: color-mix(in srgb, currentColor 10%, transparent);
		padding: 0.75rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		margin: 0.5rem 0;

		code {
			background-color: transparent;
			padding: 0;
		}
	}

	:deep(ul),
	:deep(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	:deep(li) {
		margin: 0.25rem 0;
	}

	:deep(a) {
		color: var(--theme--primary);
		text-decoration: underline;

		&:hover {
			text-decoration: none;
		}
	}
}

.message-image,
.message-part {
	padding: var(--ai-message-padding, 1rem);
	border-radius: var(--ai-message-border-radius, var(--theme--border-radius));
	background-color: var(--ai-message-background, var(--theme--background-subdued));
	color: var(--ai-message-color, var(--theme--foreground));
}

.message-actions {
	display: flex;
	gap: 0.25rem;
	align-items: center;
	margin-top: 0.25rem;
	opacity: 0;
	transition: opacity var(--fast) var(--transition);

	.ai-message:hover & {
		opacity: 1;
	}
}

// Variant styles
.ai-message[data-variant='primary'] {
	--ai-message-background: var(--theme--primary);
	--ai-message-color: white;
}

.ai-message[data-variant='subdued'] {
	--ai-message-background: var(--theme--background-subdued);
	--ai-message-color: var(--theme--foreground);
}

.ai-message[data-variant='accent'] {
	--ai-message-background: var(--theme--background-accent);
	--ai-message-color: var(--theme--foreground);
}

.ai-message[data-variant='normal'] {
	--ai-message-background: var(--theme--background-normal);
	--ai-message-color: var(--theme--foreground);
}

// Compact mode
.ai-message.compact {
	--ai-message-padding: 0.5rem 0.75rem;
	--ai-message-gap: 0.5rem;
	--ai-message-max-width: 85%;

	.message-text {
		font-size: 0.875rem;
	}
}
</style>
