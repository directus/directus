<template>
	<div class="comment-item">
		<comment-item-header :refresh="refresh" :activity="activity" @edit="editing = true" />

		<v-textarea ref="textarea" v-if="editing" v-model="edits">
			<template #append>
				<div class="buttons">
					<v-button class="cancel" @click="cancelEditing" secondary x-small>
						{{ $t('cancel') }}
					</v-button>

					<v-button
						:loading="savingEdits"
						class="post-comment"
						@click="saveEdits"
						x-small
						:disabled="edits === activity.comment"
					>
						{{ $t('save') }}
					</v-button>
				</div>
			</template>
		</v-textarea>

		<div v-else class="content">
			<span v-html="htmlContent" class="selectable" />

			<!-- @TODO: Dynamically add element below if the comment overflows -->
			<!-- <div v-if="activity.id == 204" class="expand-text">
				<span>{{ $t('click_to_expand') }}</span>
			</div> -->
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from '@vue/composition-api';
import { Activity } from './types';
import CommentItemHeader from './comment-item-header.vue';
import marked from 'marked';
import useShortcut from '@/composables/use-shortcut';

import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	components: { CommentItemHeader },
	props: {
		activity: {
			type: Object as PropType<Activity>,
			required: true,
		},
		refresh: {
			type: Function as PropType<() => void>,
			required: true,
		},
	},
	setup(props) {
		const textarea = ref<Vue>();
		const htmlContent = computed(() => (props.activity.comment ? marked(props.activity.comment) : null));

		const { edits, editing, savingEdits, saveEdits, cancelEditing } = useEdits();

		useShortcut('meta+enter', saveEdits, textarea);

		return { htmlContent, edits, editing, savingEdits, saveEdits, cancelEditing, textarea };

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
					await props.refresh();
				} catch (err) {
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

	&:last-of-type {
		margin-bottom: 8px;
	}

	.content {
		max-height: 300px;
		overflow-y: auto;

		::v-deep {
			a {
				color: var(--primary);
			}

			blockquote {
				margin: 8px 0;
				padding-left: 6px;
				color: var(--foreground-subdued);
				font-style: italic;
				border-left: 2px solid var(--border-normal);
			}

			img {
				max-width: 100%;
				margin: 8px 0;
			}

			hr {
				height: 2px;
				margin: 12px 0;
				border: 0;
				border-top: 2px solid var(--border-normal);
			}

			h1,
			h2,
			h3,
			h4,
			h5,
			h6 {
				margin-top: 12px;
				font-weight: 600;
				font-size: 16px;
			}
		}
	}

	&.expand {
		.content {
			&::after {
				position: absolute;
				right: 0;
				bottom: 4px;
				left: 0;
				z-index: 1;
				height: 40px;
				background: linear-gradient(
					180deg,
					rgba(var(--background-page-rgb), 0) 0%,
					rgba(var(--background-page-rgb), 0.8) 25%,
					rgba(var(--background-page-rgb), 1) 100%
				);
				content: '';
			}

			.expand-text {
				position: absolute;
				right: 0;
				bottom: 8px;
				left: 0;
				z-index: 2;
				height: 24px;
				text-align: center;
				cursor: pointer;

				span {
					padding: 4px 12px 5px;
					color: var(--foreground-subdued);
					font-weight: 600;
					font-size: 12px;
					background-color: var(--background-normal);
					border-radius: 12px;
					transition: color var(--fast) var(--transition), background-color var(--fast) var(--transition);
				}

				&:hover span {
					color: var(--foreground-inverted);
					background-color: var(--primary);
				}
			}
		}
	}

	&:hover {
		::v-deep .comment-header {
			.header-right {
				.time {
					opacity: 0;
				}
				.more {
					opacity: 1;
				}
			}
		}
	}
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
