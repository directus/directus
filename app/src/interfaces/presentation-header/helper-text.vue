<script setup lang="ts">
import dompurify from 'dompurify';
import { computed } from 'vue';

interface TextProps {
	content: string;
}

const props = defineProps<TextProps>();

const sanitizedContent = computed(() => dompurify.sanitize(props.content));
</script>

<template>
	<!-- eslint-disable-next-line vue/no-v-html -->
	<div v-if="content" class="helper-text selectable" v-html="sanitizedContent" />
</template>

<style scoped lang="scss">
.helper-text {
	color: var(--theme--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	line-height: var(--theme--form--field--input--line-height);

	:deep(*:not(:last-child):not(li)) {
		margin-block-end: var(--theme--form--row-gap);
	}
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
	font-weight: var(--theme--fonts--display--font-weight);
	line-height: 1.2;
	color: var(--theme--foreground-accent);
	margin-block-end: var(--theme--form--row-gap);
}

:deep(h1, h2, h3, h4, h5, h6) {
	font-family: var(--theme--fonts--display--font-family);
}

:deep(h1) {
	font-size: 28px;
	font-family: var(--theme--fonts--display--font-family);
}

:deep(h2) {
	font-size: 24px;
	font-family: var(--theme--fonts--display--font-family);
}

:deep(h3) {
	font-size: 20px;
}

:deep(h4) {
	font-size: 18px;
}

:deep(h5) {
	font-size: 16px;
}

:deep(h6) {
	font-size: 14px;
}

:deep(p) {
	margin-block-end: var(--theme--form--row-gap);
}

:deep(a) {
	color: var(--theme--primary);
	text-decoration: none;
}

:deep(a:hover) {
	text-decoration: underline;
}

:deep(img) {
	max-inline-size: 100%;
	block-size: auto;
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--card--shadow);
}

:deep(iframe) {
	max-inline-size: 100%;
	border-radius: var(--theme--border-radius);
}

:deep(ul),
:deep(ol) {
	padding-inline-start: calc(var(--theme--form--field--input--padding) * 1.5);
	margin-block-end: var(--theme--form--row-gap);
}

:deep(li > p) {
	margin-block-end: calc(var(--theme--form--row-gap) / 3);
}

:deep(li) {
	margin-block-end: calc(var(--theme--form--row-gap) / 3);
}

:deep(pre),
:deep(code) {
	font-family: var(--theme--fonts--monospace--font-family);
	background-color: var(--theme--background-subdued);
	padding: calc(var(--theme--form--field--input--padding) / 2);
	border-radius: var(--theme--border-radius);
	font-size: 14px;
	color: var(--theme--foreground);
	overflow-x: auto;
}

:deep(pre) {
	margin-block-end: var(--theme--form--row-gap);
}

:deep(blockquote) {
	border-inline-start: 3px solid var(--theme--primary);
	padding-inline-start: var(--theme--form--field--input--padding);
	margin-inline-start: 0;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

:deep(table) {
	border-collapse: collapse;
	inline-size: 100%;
	margin-block-end: var(--theme--form--row-gap);
}

:deep(th),
:deep(td) {
	border: var(--theme--border-width) solid var(--theme--border-color);
	padding: calc(var(--theme--form--field--input--padding) / 2);
	text-align: start;
}

:deep(th) {
	background-color: var(--theme--background-subdued);
	font-weight: var(--theme--fonts--sans--font-weight);
	color: var(--theme--foreground-accent);
}

:deep(hr) {
	border: none;
	border-block-start: var(--theme--border-width) solid var(--theme--border-color);
	margin: calc(var(--theme--form--row-gap) * 1.5) 0;
}

:deep(div) {
	margin-block-end: var(--theme--form--row-gap);
}
</style>
