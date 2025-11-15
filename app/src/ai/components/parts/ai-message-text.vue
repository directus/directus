<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps<{
	text: string;
	state: 'streaming' | 'done';
	role?: 'user' | 'assistant' | 'system';
}>();

const contentRef = ref<HTMLElement | null>(null);
const shouldCollapse = ref(false);
const isOpen = ref(false);

const MAX_HEIGHT = 250;

onMounted(() => {
	if (props.role === 'user' && contentRef.value) {
		const height = contentRef.value.scrollHeight;
		shouldCollapse.value = height > MAX_HEIGHT;
	}
});

function toggleCollapse() {
	isOpen.value = !isOpen.value;
}
</script>

<template>
	<div class="message-text" :class="{ 'has-collapse': shouldCollapse, 'is-open': isOpen }" :data-role="role">
		<div class="content-wrapper">
			<div ref="contentRef" v-md="text || ''" class="message-content"></div>
			<div v-if="shouldCollapse && !isOpen" class="fade-overlay"></div>
		</div>
		<button v-if="shouldCollapse" class="collapse-trigger" @click="toggleCollapse">
			{{ isOpen ? $t('ai.message.show_less') : $t('ai.message.show_more') }}
		</button>
	</div>
</template>

<style scoped>
.message-text {
	inline-size: 100%;
	border-radius: var(--ai-message-border-radius, calc(var(--theme--border-radius)));
	background-color: var(--ai-message-background);
	color: var(--ai-message-color, var(--theme--foreground));
	overflow-wrap: break-word;

	--ai-message-text-border-color: var(--theme--border-color-accent);
	--ai-message-text-blockquote-border-color: var(--theme--border-color-accent);
	--ai-message-code-background: var(--theme--background);

	&[data-role='assistant'] {
		.message-content {
			padding: 0.4rem 0;
		}

		--ai-message-code-background: var(--theme--background-subdued);
	}

	&[data-role='user'] {
		--ai-message-text-border-color: var(--theme--border-color);

		border-start-end-radius: 0;

		.message-content {
			padding: 0.8rem 1rem;
		}

		--ai-message-code-background: var(--theme--background-normal);
	}

	&.has-collapse .message-content {
		padding-block-end: 0;
	}

	&.has-collapse.is-open .message-content {
		padding-block-end: 0.8rem;
	}
}

.content-wrapper {
	position: relative;
	transition: max-block-size var(--fast) var(--transition);
}

.has-collapse:not(.is-open) .content-wrapper {
	max-block-size: 250px;
	overflow: hidden;
}

.is-open .content-wrapper {
	max-block-size: 9999px;
}

/* Headings */
:deep(h1) {
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.3;
	margin: 1rem 0 0.5rem;

	&:first-child {
		margin-block-start: 0;
	}
}

:deep(h2) {
	font-size: 1.25rem;
	font-weight: 700;
	line-height: 1.3;
	margin: 0.875rem 0 0.5rem;

	&:first-child {
		margin-block-start: 0;
	}
}

:deep(h3) {
	font-size: 1.125rem;
	font-weight: 600;
	line-height: 1.4;
	margin: 0.75rem 0 0.5rem;

	&:first-child {
		margin-block-start: 0;
	}
}

:deep(h4) {
	font-size: 1rem;
	font-weight: 600;
	line-height: 1.4;
	margin: 0.75rem 0 0.375rem;

	&:first-child {
		margin-block-start: 0;
	}
}

:deep(h5) {
	font-size: 0.9375rem;
	font-weight: 600;
	line-height: 1.5;
	margin: 0.625rem 0 0.375rem;

	&:first-child {
		margin-block-start: 0;
	}
}

:deep(h6) {
	font-size: 0.875rem;
	font-weight: 600;
	line-height: 1.5;
	margin: 0.5rem 0 0.375rem;

	&:first-child {
		margin-block-start: 0;
	}
}

/* Paragraphs */
:deep(p) {
	margin: 0.5rem 0;
	line-height: 1.6;

	&:first-child {
		margin-block-start: 0;
	}

	&:last-child {
		margin-block-end: 0;
	}
}

/* Emphasis */
:deep(strong),
:deep(b) {
	font-weight: 600;
}

:deep(em),
:deep(i) {
	font-style: italic;
}

:deep(del),
:deep(s) {
	text-decoration: line-through;
	color: var(--theme--foreground-subdued);
}

/* Code */
:deep(code) {
	background-color: var(--ai-message-code-background);
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 0.875em;
}

:deep(pre) {
	font-family: var(--theme--fonts--monospace--font-family);
	margin: 0.75rem 0;
	padding: 1rem;
	background-color: var(--ai-message-code-background);
	border-radius: var(--theme--border-radius);
	overflow-x: auto;

	code {
		background-color: transparent;
		padding: 0;
	}
}

/* Lists */
:deep(ul),
:deep(ol) {
	margin: 0.5rem 0;
	padding-inline-start: 1.5rem;
}

:deep(li) {
	margin: 0.25rem 0;
	line-height: 1.6;
}

:deep(ul ul),
:deep(ol ol),
:deep(ul ol),
:deep(ol ul) {
	margin: 0.25rem 0;
}

/* Task lists */
:deep(ul:has(input[type='checkbox'])) {
	list-style: none;
	padding-inline-start: 0.25rem;
}

:deep(li:has(input[type='checkbox'])) {
	padding-inline-start: 0.25rem;
}

:deep(input[type='checkbox']) {
	position: relative;
	inline-size: 20px;
	block-size: 20px;
	margin-inline-end: 0.5rem;
	margin-block-start: 0.1em;
	vertical-align: top;
	appearance: none;
	background-color: transparent;
	border: 2px solid var(--theme--foreground-subdued);
	border-radius: 2px;
	cursor: pointer;
	transition: all var(--fast) var(--transition);

	&:hover:not(:disabled) {
		border-color: var(--theme--primary);
	}

	&:checked {
		border-color: var(--theme--primary);
		background-color: transparent;

		&::after {
			content: '';
			position: absolute;
			inset-inline-start: 5px;
			inline-size: 5px;
			block-size: 10px;
			border: solid var(--theme--primary);
			border-width: 0 2px 2px 0;
			transform: rotate(45deg);
		}
	}

	&:disabled {
		cursor: not-allowed;
		border-color: var(--theme--foreground-subdued);

		&:checked {
			&::after {
				border-color: var(--theme--foreground-subdued);
			}
		}
	}
}

/* Links */
:deep(a) {
	color: var(--theme--primary);
	text-decoration: underline;

	&:hover {
		text-decoration: none;
	}
}

/* Blockquotes */
:deep(blockquote) {
	margin: 1rem 0;
	padding: 0.75rem 1rem;
	border-inline-start: 0.25rem solid var(--ai-message-text-blockquote-border-color);

	p:first-child {
		margin-block-start: 0;
	}

	p:last-child {
		margin-block-end: 0;
	}
}

/* Horizontal Rule */
:deep(hr) {
	margin: 1.5rem 0;
	border: none;
	border-block-start: var(--theme--border-width) solid var(--ai-message-text-border-color);
}

/* Tables */
:deep(table) {
	inline-size: 100%;
	border-collapse: collapse;
	margin: 1rem 0;
	overflow: auto;
	display: block;
}

:deep(thead) {
	background-color: var(--theme--background);
}

:deep(th),
:deep(td) {
	padding: 0.5rem 0.75rem;
	border: var(--theme--border-width) solid var(--theme--border-color-accent);
	text-align: start;
}

:deep(th) {
	font-weight: 700;
}

:deep(tr:nth-child(even)) {
	background-color: var(--theme--background-subdued);
}

/* Images */
:deep(img) {
	max-inline-size: 100%;
	block-size: auto;
	border-radius: var(--theme--border-radius);
	margin: 0.5rem 0;
}

/* Collapsible */
.fade-overlay {
	position: absolute;
	inset-block-end: 0;
	inset-inline: 0;
	block-size: 80px;
	background: linear-gradient(to bottom, transparent, var(--ai-message-background));
	pointer-events: none;
}

.collapse-trigger {
	position: relative;
	display: block;
	inline-size: 100%;
	padding: 0.5rem 1rem 0.8rem;
	text-align: start;
	z-index: 1;
	font-size: 0.875rem;
	color: var(--ai-message-color, var(--theme--foreground));
	font-weight: 600;
	cursor: pointer;
	background: none;
	border: none;
	border-radius: var(--ai-message-border-radius, var(--theme--border-radius));

	&:hover {
		color: var(--ai-message-color-hover, var(--theme--foreground-accent));
	}
}
</style>
