<template>
	<v-textarea
		ref="textarea"
		v-model="newCommentContent"
		class="new-comment"
		:placeholder="t('leave_comment')"
		expand-on-focus
	>
		<template #append>
			<v-button
				:disabled="!newCommentContent || newCommentContent.length === 0"
				:loading="saving"
				class="post-comment"
				x-small
				@click="postComment"
			>
				{{ t('submit') }}
			</v-button>
		</template>
	</v-textarea>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, PropType } from 'vue';
import api from '@/api';
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
		const { t } = useI18n();

		const textarea = ref<HTMLElement>();
		useShortcut('meta+enter', postComment, textarea);
		const newCommentContent = ref<string | null>(null);
		const saving = ref(false);

		return { t, newCommentContent, postComment, saving, textarea };

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
					title: t('post_comment_success'),
					type: 'success',
				});
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				saving.value = false;
			}
		}
	},
});
</script>

<style scoped>
.new-comment :deep(.expand-on-focus textarea) {
	position: relative;
	transition: margin-bottom var(--fast) var(--transition);
}

.new-comment :deep(.expand-on-focus:focus textarea),
.new-comment :deep(.expand-on-focus:focus-within textarea),
.new-comment :deep(.expand-on-focus.has-content textarea) {
	margin-bottom: 36px;
}

.new-comment :deep(.expand-on-focus .append::after) {
	position: absolute;
	right: 0;
	bottom: 36px;
	left: 0;
	height: 8px;
	background: linear-gradient(180deg, rgb(var(--background-page-rgb), 0) 0%, rgb(var(--background-page-rgb), 1) 100%);
	content: '';
}

.new-comment .add-mention {
	position: absolute;
	bottom: 8px;
	left: 8px;
	color: var(--foreground-subdued);
	cursor: pointer;
	transition: color var(--fast) var(--transition);
}

.new-comment .add-emoji {
	position: absolute;
	bottom: 8px;
	left: 36px;
	color: var(--foreground-subdued);
	cursor: pointer;
	transition: color var(--fast) var(--transition);
}

.new-comment .add-mention:hover,
.new-comment .add-emoji:hover {
	color: var(--primary);
}

.new-comment .post-comment {
	position: absolute;
	right: 8px;
	bottom: 8px;
}
</style>
