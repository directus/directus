<script setup lang="ts">
defineProps<{
	text: string;
	state: 'streaming' | 'done';
}>();
</script>

<template>
	<div v-md="text || ''" class="message-text"></div>
</template>

<style scoped>
.message-text {
	padding: var(--ai-message-padding, 0.5rem);
	border-radius: var(--ai-message-border-radius, var(--theme--border-radius));
	background-color: var(--ai-message-background);
	color: var(--ai-message-color, var(--theme--foreground));
	word-wrap: break-word;
	overflow-wrap: break-word;
}
/* Headings */
:deep(h1) {
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.3;
	margin: 1rem 0 0.5rem;

	&:first-child {
		margin-top: 0;
	}
}

:deep(h2) {
	font-size: 1.25rem;
	font-weight: 700;
	line-height: 1.3;
	margin: 0.875rem 0 0.5rem;

	&:first-child {
		margin-top: 0;
	}
}

:deep(h3) {
	font-size: 1.125rem;
	font-weight: 600;
	line-height: 1.4;
	margin: 0.75rem 0 0.5rem;

	&:first-child {
		margin-top: 0;
	}
}

:deep(h4) {
	font-size: 1rem;
	font-weight: 600;
	line-height: 1.4;
	margin: 0.75rem 0 0.375rem;

	&:first-child {
		margin-top: 0;
	}
}

:deep(h5) {
	font-size: 0.9375rem;
	font-weight: 600;
	line-height: 1.5;
	margin: 0.625rem 0 0.375rem;

	&:first-child {
		margin-top: 0;
	}
}

:deep(h6) {
	font-size: 0.875rem;
	font-weight: 600;
	line-height: 1.5;
	margin: 0.5rem 0 0.375rem;

	&:first-child {
		margin-top: 0;
	}
}

/* Paragraphs */
:deep(p) {
	margin: 0.5rem 0;
	line-height: 1.6;

	&:first-child {
		margin-top: 0;
	}

	&:last-child {
		margin-bottom: 0;
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
	opacity: 0.7;
}

/* Code */
:deep(code) {
	background-color: var(--theme--background);
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 0.875em;
}

:deep(pre) {
	margin: 0.75rem 0;
	padding: 1rem;
	background-color: var(--theme--background);
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
	padding-left: 1.5rem;
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
:deep(input[type='checkbox']) {
	margin-right: 0.5rem;
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
	border-left: 0.25rem solid var(--theme--border-color);
	background-color: var(--theme--background-subdued);
	color: var(--theme--foreground-subdued);

	p:first-child {
		margin-top: 0;
	}

	p:last-child {
		margin-bottom: 0;
	}
}

/* Horizontal Rule */
:deep(hr) {
	margin: 1.5rem 0;
	border: none;
	border-top: 1px solid var(--theme--border-color);
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
	background-color: var(--theme--background-subdued);
}

:deep(th),
:deep(td) {
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--theme--border-color);
	text-align: left;
}

:deep(th) {
	font-weight: 600;
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
</style>
