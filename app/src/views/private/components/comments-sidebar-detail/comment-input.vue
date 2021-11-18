<template>
	<v-menu v-model="showMentionDropDown">
		<template #activator>
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
		<v-list v-for="user in users" id="suggestions" :key="user.id" @click="insertUsername(user)">
			<v-avatar x-small>
				<img v-if="user.avatar" :src="avatarSource(user.avatar)" />
				<v-icon v-else name="person_outline" />
			</v-avatar>
			<div class="spacer">
				{{ userName(user) }}
			</div>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, PropType, ComponentPublicInstance, watch } from 'vue';
import api, { addTokenToURL } from '@/api';
import useShortcut from '@/composables/use-shortcut';
import { notify } from '@/utils/notify';
import { userName } from '@/utils/user-name';
import { useCaret } from '@/composables/use-caret';
import { unexpectedError } from '@/utils/unexpected-error';
import { throttle } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import { User } from '@directus/shared/types';
import { getRootPath } from '@/utils/get-root-path';

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
		const textarea = ref<ComponentPublicInstance>();
		useShortcut('meta+enter', postComment, textarea);
		const newCommentContent = ref<string | null>(null);
		const saving = ref(false);
		const showMentionDropDown = ref(false);
		let users = ref<User[]>([]);
		let selectionStart: number | null = null;
		let selectionEnd: number | null = null;

		const { caretPosition } = useCaret(textarea);

		watch(caretPosition, (newPosition) => {
			const text = newCommentContent.value;
			if (text === null || newPosition === undefined) return;

			let word = '';
			let countBefore = newPosition - 1;
			let countAfter = newPosition;

			if (text.charAt(countBefore) !== ' ') {
				while (countBefore >= 0 && text.charAt(countBefore) !== ' ') {
					word = text.charAt(countBefore) + word;
					countBefore--;
				}
			}

			while (countAfter < text.length && text.charAt(countAfter) !== ' ') {
				word = word + text.charAt(countAfter);
				countAfter++;
			}

			if (word.startsWith('@') === false) {
				showMentionDropDown.value = false;
				return;
			}

			showMentionDropDown.value = true;
			loadUsers(word.substr(1));

			selectionStart = countBefore + 1;
			selectionEnd = countAfter;
		});

		let cancelToken: CancelTokenSource | null = null;

		const loadUsers = throttle(async (name: string) => {
			if (cancelToken !== null) {
				cancelToken.cancel();
			}

			cancelToken = axios.CancelToken.source();
			const regex = /([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/gm;
			let filter: Record<string, any> = {
				_or: [
					{
						first_name: {
							_starts_with: name,
						},
					},
					{
						last_name: {
							_starts_with: name,
						},
					},
					{
						email: {
							_starts_with: name,
						},
					},
				],
			};
			if (name.match(regex)) {
				filter = {
					id: {
						_in: name,
					},
				};
			}
			try {
				const result = await api.get('/users', {
					params: {
						filter: name === '' || !name ? undefined : filter,
						fields: ['first_name', 'last_name', 'email', 'id', 'avatar'],
					},
					cancelToken: cancelToken.token,
				});
				users.value = result.data.data;
			} catch (e) {
				return e;
			}
		}, 2);

		return {
			t,
			newCommentContent,
			postComment,
			saving,
			textarea,
			showMentionDropDown,
			users,
			userName,
			caretPosition,
			insertUsername,
			avatarSource,
		};

		function avatarSource(url: string) {
			if (url === null) return '';
			return addTokenToURL(getRootPath() + `assets/${url}?key=system-small-cover`);
		}
		function insertUsername(user: User) {
			if (newCommentContent.value === null || selectionStart === null || selectionEnd === null) return;

			newCommentContent.value =
				newCommentContent.value.slice(0, selectionStart) +
				'@' +
				user.id +
				newCommentContent.value.slice(selectionEnd) +
				' ';

			const textarea = document.querySelector('textarea');
			textarea?.focus();
			if (!selectionStart && selectionStart != 0) return;
			textarea?.setSelectionRange(selectionStart + 38, selectionStart + 38);
		}

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

.spacer {
	margin-inline-start: 10px;
}

#suggestions {
	display: flex;
	flex-direction: row;
	overflow-x: hidden;
}
</style>
