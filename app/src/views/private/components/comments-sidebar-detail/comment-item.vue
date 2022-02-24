<template>
	<div class="comment-item">
		<comment-item-header :refresh="refresh" :activity="activity" @edit="editing = true" />

		<comment-input
			v-if="editing"
			:existing-comment="activity"
			:primary-key="primaryKey"
			:collection="collection"
			:refresh="refresh"
			:previews="userPreviews"
			@cancel="cancelEditing"
		/>

		<div v-else v-md="activity.display" class="content selectable" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, ref, watch, ComponentPublicInstance } from 'vue';
import { Activity } from './types';
import CommentItemHeader from './comment-item-header.vue';
import CommentInput from './comment-input.vue';
import useShortcut from '@/composables/use-shortcut';

import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	components: { CommentItemHeader, CommentInput },
	props: {
		activity: {
			type: Object as PropType<Activity>,
			required: true,
		},
		refresh: {
			type: Function as PropType<() => void>,
			required: true,
		},
		userPreviews: {
			type: Object,
			require: true,
			default: () => ({}),
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const textarea = ref<ComponentPublicInstance>();

		const { edits, editing, savingEdits, saveEdits, cancelEditing } = useEdits();

		useShortcut('meta+enter', saveEdits, textarea);

		return { t, edits, editing, savingEdits, saveEdits, cancelEditing, textarea };

		function useEdits() {
			const edits = ref(props.activity.comment);
			const editing = ref(false);
			const savingEdits = ref(false);

			watch(
				() => props.activity,
				() => (edits.value = props.activity.comment)
			);

			return { edits, editing, savingEdits, saveEdits, cancelEditing };

			async function saveEdits() {
				savingEdits.value = true;

				try {
					await api.patch(`/activity/comment/${props.activity.id}`, {
						comment: edits.value,
					});

					props.refresh();
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					savingEdits.value = false;
					editing.value = false;
				}
			}

			function cancelEditing() {
				edits.value = props.activity.comment;
				editing.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.comment-item {
	position: relative;
	margin-bottom: 16px;
	padding: 8px;
	background-color: var(--background-page);
	border-radius: var(--border-radius);
}

.comment-item:last-of-type {
	margin-bottom: 8px;
}

.comment-item .content {
	display: inline-block;
	max-height: 300px;
	overflow-y: auto;
}

.comment-item .content :deep(a) {
	color: var(--primary);
}

.comment-item .content :deep(blockquote) {
	margin: 8px 0;
	padding-left: 6px;
	color: var(--foreground-subdued);
	font-style: italic;
	border-left: 2px solid var(--border-normal);
}

.comment-item .content :deep(img) {
	max-width: 100%;
	margin: 8px 0;
}

.comment-item .content :deep(hr) {
	height: 2px;
	margin: 12px 0;
	border: 0;
	border-top: 2px solid var(--border-normal);
}

.comment-item .content :deep(mark) {
	display: inline-block;
	padding: 2px 4px;
	color: var(--primary);
	line-height: 1;
	background: var(--primary-alt);
	border-radius: var(--border-radius);
	user-select: text;
	pointer-events: none;
}

.comment-item .content :deep(:is(h1, h2, h3, h4, h5, h6)) {
	margin-top: 12px;
	font-weight: 600;
	font-size: 16px;
}

.comment-item.expand .content::after {
	position: absolute;
	right: 0;
	bottom: 4px;
	left: 0;
	z-index: 1;
	height: 40px;
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
	right: 0;
	bottom: 8px;
	left: 0;
	z-index: 2;
	height: 24px;
	text-align: center;
	cursor: pointer;
}

.comment-item.expand .content .expand-text span {
	padding: 4px 12px 5px;
	color: var(--foreground-subdued);
	font-weight: 600;
	font-size: 12px;
	background-color: var(--background-normal);
	border-radius: 12px;
	transition: color var(--fast) var(--transition), background-color var(--fast) var(--transition);
}

.comment-item.expand .content .expand-text:hover span {
	color: var(--foreground-inverted);
	background-color: var(--primary);
}

.comment-item:hover :deep(.comment-header .header-right .time) {
	opacity: 0;
}

.comment-item:hover :deep(.comment-header .header-right .more) {
	opacity: 1;
}

.user-name {
	color: var(--primary);
}

.buttons {
	position: absolute;
	right: 8px;
	bottom: 8px;
}

.cancel {
	margin-right: 4px;
}
</style>
