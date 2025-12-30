<script setup lang="ts">
import CommentInput from './comment-input.vue';
import CommentItemHeader from './comment-item-header.vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import type { Comment, User } from '@directus/types';
import { ref, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		comment: Comment & {
			display: string;
			user_created: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
		};
		refresh: () => Promise<void>;
		collection: string;
		primaryKey: string | number;
		userPreviews?: Record<string, any>;
	}>(),
	{
		userPreviews: () => ({}),
	},
);

const { editing, cancelEditing } = useEdits();

function useEdits() {
	const edits = ref(props.comment.comment);
	const editing = ref(false);
	const savingEdits = ref(false);

	watch(
		() => props.comment,
		() => (edits.value = props.comment.comment),
	);

	return { edits, editing, savingEdits, saveEdits, cancelEditing };

	async function saveEdits() {
		savingEdits.value = true;

		try {
			await api.patch(`/comments/${props.comment.id}`, {
				comment: edits.value,
			});

			props.refresh();
		} catch (error) {
			unexpectedError(error);
		} finally {
			savingEdits.value = false;
			editing.value = false;
		}
	}

	function cancelEditing() {
		edits.value = props.comment.comment;
		editing.value = false;
	}
}
</script>

<template>
	<div class="comment-item">
		<CommentItemHeader :refresh="refresh" :comment="comment" @edit="editing = true" />

		<CommentInput
			v-if="editing"
			:existing-comment="comment"
			:primary-key="primaryKey"
			:collection="collection"
			:refresh="refresh"
			:previews="userPreviews"
			@cancel="cancelEditing"
		/>

		<div v-else v-md="{ value: comment.display, target: '_blank' }" class="content" />
	</div>
</template>

<style lang="scss" scoped>
.comment-item {
	position: relative;
	margin-block-end: 8px;
	padding: 8px;
	background-color: var(--theme--background);
	border-radius: var(--theme--border-radius);
}

.comment-item:last-of-type {
	margin-block-end: 8px;
}

.comment-item .content {
	display: inline-block;
	max-block-size: 300px;
	overflow-y: auto;
	min-inline-size: 100%;
	max-inline-size: 100%;
	margin-block-end: -6px;
	line-height: 1.4;
}

.comment-item .content :deep(> *:first-child),
.comment-item .content :deep(p > *:first-child) {
	margin-block-start: 0;
}

.comment-item .content :deep(> *:last-child),
.comment-item .content :deep(p > *:last-child) {
	margin-block-end: 0;
}

.comment-item .content :deep(a) {
	color: var(--theme--primary);
}

.comment-item .content :deep(blockquote) {
	margin: 8px 0;
	padding-inline-start: 6px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
	border-inline-start: 2px solid var(--theme--form--field--input--border-color);
}

.comment-item .content :deep(img) {
	max-inline-size: 100%;
	margin: 8px 0;
	border-radius: var(--theme--border-radius);
	display: block;
}

.comment-item .content :deep(hr) {
	block-size: 2px;
	margin: 12px 0;
	border: 0;
	border-block-start: 2px solid var(--theme--form--field--input--border-color);
}

.comment-item .content :deep(mark) {
	display: inline-block;
	padding: 2px 4px;
	color: var(--theme--primary);
	line-height: 1;
	background: var(--theme--primary-background);
	border-radius: var(--theme--border-radius);
	pointer-events: none;
}

.comment-item .content :deep(pre) {
	padding: 2px 4px;
	color: var(--theme--foreground);
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	margin: 2px 0;
	font-family: var(--theme--fonts--monospace--font-family);
	white-space: nowrap;
	max-inline-size: 100%;
	overflow-x: auto;
}

.comment-item .content :deep(code) {
	padding: 2px 4px;
	color: var(--theme--foreground);
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	margin: 2px 0;
	font-family: var(--theme--fonts--monospace--font-family);
}

.comment-item .content :deep(pre > code) {
	padding: 0;
	margin: 0;
	white-space: pre;
}

.comment-item .content :deep(:is(h1, h2, h3, h4, h5, h6)) {
	margin-block-start: 12px;
	font-weight: 600;
	font-size: 16px;
	color: var(--theme--foreground-accent);
}

.comment-item.expand .content::after {
	position: absolute;
	inset-inline: 0;
	inset-block-end: 4px;
	z-index: 1;
	block-size: 40px;
	background: linear-gradient(
		180deg,
		rgb(var(--background-page-rgb), 0) 0%,
		rgb(var(--background-page-rgb), 0.8) 25%,
		rgb(var(--background-page-rgb), 1) 100%
	);
	content: '';
}

.comment-item.expand .content .expand-text {
	position: absolute;
	inset-inline: 0;
	inset-block-end: 8px;
	z-index: 2;
	block-size: 24px;
	text-align: center;
	cursor: pointer;
}

.comment-item.expand .content .expand-text span {
	padding: 4px 12px 5px;
	color: var(--theme--foreground-subdued);
	font-weight: 600;
	font-size: 12px;
	background-color: var(--theme--background-normal);
	border-radius: 12px;
	transition:
		color var(--fast) var(--transition),
		background-color var(--fast) var(--transition);
}

.comment-item.expand .content .expand-text:hover span {
	color: var(--foreground-inverted);
	background-color: var(--theme--primary);
}

.comment-item :deep(.comment-header .header-right .more:focus-visible + .time),
.comment-item:hover :deep(.comment-header .header-right .time) {
	opacity: 0;
}

.comment-item :deep(.comment-header .header-right .more:focus-visible),
.comment-item:hover :deep(.comment-header .header-right .more) {
	opacity: 1;
}

.user-name {
	color: var(--theme--primary);
}

.buttons {
	position: absolute;
	inset-inline-end: 8px;
	inset-block-end: 8px;
}

.cancel {
	margin-inline-end: 4px;
}
</style>
