<template>
	<v-textarea
		class="new-comment"
		:placeholder="$t('leave_comment')"
		v-model="newCommentContent"
		expand-on-focus
		ref="textarea"
	>
		<template #append>
			<!-- <v-icon name="alternate_email" class="add-mention" />
			<v-icon name="insert_emoticon" class="add-emoji" /> -->
			<v-button
				:disabled="!newCommentContent || newCommentContent.length === 0"
				:loading="saving"
				class="post-comment"
				@click="postComment"
				x-small
			>
				{{ $t('submit') }}
			</v-button>
		</template>
	</v-textarea>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import api from '@/api';
import i18n from '@/lang';
import useShortcut from '@/composables/use-shortcut';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	props: {
		refresh: {
			type: Function as PropType<() => void>,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
	},
	setup(props) {
		const textarea = ref<HTMLElement>();
		useShortcut('meta+enter', postComment, textarea);
		const newCommentContent = ref<string | null>(null);
		const saving = ref(false);

		return { newCommentContent, postComment, saving, textarea };

		async function postComment() {
			if (newCommentContent.value === null || newCommentContent.value.length === 0) return;
			saving.value = true;

			try {
				await api.post(`/activity/comment`, {
					collection: props.collection,
					item: props.primaryKey,
					comment: newCommentContent.value,
				});

				await props.refresh();

				newCommentContent.value = null;

				notify({
					title: i18n.t('post_comment_success'),
					type: 'success',
				});
			} catch (err) {
				unexpectedError(err);
			} finally {
				saving.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.new-comment {
	&::v-deep {
		&.expand-on-focus {
			textarea {
				position: relative;
				transition: margin-bottom var(--fast) var(--transition);
			}

			.append {
				&::after {
					position: absolute;
					right: 0;
					bottom: 36px;
					left: 0;
					height: 8px;
					background: linear-gradient(
						180deg,
						rgba(var(--background-page-rgb), 0) 0%,
						rgba(var(--background-page-rgb), 1) 100%
					);
					content: '';
				}
			}

			&:focus,
			&:focus-within,
			&.has-content {
				textarea {
					margin-bottom: 36px;
				}
			}
		}
	}

	.add-mention {
		position: absolute;
		bottom: 8px;
		left: 8px;
		color: var(--foreground-subdued);
		cursor: pointer;
		transition: color var(--fast) var(--transition);
	}

	.add-emoji {
		position: absolute;
		bottom: 8px;
		left: 36px;
		color: var(--foreground-subdued);
		cursor: pointer;
		transition: color var(--fast) var(--transition);
	}

	.add-mention,
	.add-emoji {
		&:hover {
			color: var(--primary);
		}
	}

	.post-comment {
		position: absolute;
		right: 8px;
		bottom: 8px;
	}
}
</style>
