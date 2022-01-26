<template>
	<div class="input-container">
		<v-menu v-model="showMentionDropDown" attached>
			<template #activator>
				<v-template-input
					v-model="newCommentContent"
					capture-group="(@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})"
					multiline
					trigger-character="@"
					:items="userPreviews"
					@trigger="triggerSearch"
					@deactivate="showMentionDropDown = false"
					@up="pressedUp"
					@down="pressedDown"
					@enter="pressedEnter"
				/>
			</template>

			<v-list>
				<v-list-item
					v-for="(user, index) in searchResult"
					id="suggestions"
					:key="user.id"
					clickable
					:active="index === selectedKeyboardIndex"
					@click="insertUser(user)"
				>
					<v-list-item-icon>
						<v-avatar x-small>
							<img v-if="user.avatar" :src="avatarSource(user.avatar)" />
							<v-icon v-else name="person_outline" />
						</v-avatar>
					</v-list-item-icon>

					<v-list-item-content>
						{{ userName(user) }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<div class="buttons">
			<v-button v-if="existingComment" class="cancel" x-small secondary @click="$emit('cancel')">
				{{ t('cancel') }}
			</v-button>
			<v-button
				:disabled="!newCommentContent || newCommentContent.length === 0"
				:loading="saving"
				class="post-comment"
				x-small
				@click="postComment"
			>
				{{ t('submit') }}
			</v-button>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, PropType, watch } from 'vue';
import api, { addTokenToURL } from '@/api';
import useShortcut from '@/composables/use-shortcut';
import { notify } from '@/utils/notify';
import { userName } from '@/utils/user-name';
import { unexpectedError } from '@/utils/unexpected-error';
import { throttle } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import { User } from '@directus/shared/types';
import { getRootPath } from '@/utils/get-root-path';
import vTemplateInput from '@/components/v-template-input.vue';
import { cloneDeep } from 'lodash';

export default defineComponent({
	components: { vTemplateInput },
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
		existingComment: {
			type: Object,
			default: null,
		},
		previews: {
			type: Object as PropType<Record<string, string>>,
			default: null,
		},
	},
	emits: ['cancel'],
	setup(props) {
		const { t } = useI18n();
		const textarea = ref<HTMLElement>();
		useShortcut('meta+enter', postComment, textarea);

		const newCommentContent = ref<string | null>(props.existingComment?.comment ?? null);

		watch(
			() => props.existingComment,
			() => {
				if (props.existingComment?.comment) {
					newCommentContent.value = props.existingComment.comment;
				}
			},
			{ immediate: true }
		);

		const saving = ref(false);
		const showMentionDropDown = ref(false);

		const searchResult = ref<User[]>([]);
		const userPreviews = ref<Record<string, string>>({});

		watch(
			() => props.previews,
			() => {
				if (props.previews) {
					userPreviews.value = {
						...userPreviews.value,
						...props.previews,
					};
				}
			},
			{ immediate: true }
		);

		let triggerCaretPosition = 0;
		let selectedKeyboardIndex = ref<number>(0);

		let cancelToken: CancelTokenSource | null = null;

		const loadUsers = throttle(async (name: string) => {
			if (cancelToken !== null) {
				cancelToken.cancel();
			}

			cancelToken = axios.CancelToken.source();

			const regex = /\s@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/gi;

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

				const newUsers = cloneDeep(userPreviews.value);

				result.data.data.forEach((user: any) => {
					newUsers[user.id] = userName(user);
				});

				userPreviews.value = newUsers;

				searchResult.value = result.data.data;
			} catch (e) {
				return e;
			}
		}, 200);

		return {
			t,
			newCommentContent,
			postComment,
			saving,
			textarea,
			showMentionDropDown,
			searchResult,
			avatarSource,
			userName,
			triggerSearch,
			insertUser,
			userPreviews,
			selectedKeyboardIndex,
			pressedUp,
			pressedDown,
			pressedEnter,
		};

		function insertUser(user: Record<string, any>) {
			const text = newCommentContent.value?.replaceAll(String.fromCharCode(160), ' ');
			if (!text) return;

			let countBefore = triggerCaretPosition - 1;
			let countAfter = triggerCaretPosition;

			if (text.charAt(countBefore) !== ' ' && text.charAt(countBefore) !== '\n') {
				while (countBefore >= 0 && text.charAt(countBefore) !== ' ' && text.charAt(countBefore) !== '\n') {
					countBefore--;
				}
			}

			while (countAfter < text.length && text.charAt(countAfter) !== ' ' && text.charAt(countAfter) !== '\n') {
				countAfter++;
			}

			const before = text.substring(0, countBefore + (text.charAt(countBefore) === '\n' ? 1 : 0));
			const after = text.substring(countAfter);

			newCommentContent.value = before + ' @' + user.id + after;
		}

		function triggerSearch({ searchQuery, caretPosition }: { searchQuery: string; caretPosition: number }) {
			triggerCaretPosition = caretPosition;

			showMentionDropDown.value = true;
			loadUsers(searchQuery);
			selectedKeyboardIndex.value = 0;
		}

		function avatarSource(url: string) {
			if (url === null) return '';
			return addTokenToURL(getRootPath() + `assets/${url}?key=system-small-cover`);
		}

		async function postComment() {
			if (newCommentContent.value === null || newCommentContent.value.length === 0) return;
			saving.value = true;

			try {
				if (props.existingComment) {
					await api.patch(`/activity/comment/${props.existingComment.id}`, {
						comment: newCommentContent.value,
					});
				} else {
					await api.post(`/activity/comment`, {
						collection: props.collection,
						item: props.primaryKey,
						comment: newCommentContent.value,
					});
				}

				props.refresh();

				newCommentContent.value = '';

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

		function pressedUp() {
			if (selectedKeyboardIndex.value > 0) {
				selectedKeyboardIndex.value--;
			}
		}

		function pressedDown() {
			if (selectedKeyboardIndex.value < searchResult.value.length - 1) {
				selectedKeyboardIndex.value++;
			}
		}

		function pressedEnter() {
			insertUser(searchResult.value[selectedKeyboardIndex.value]);
			showMentionDropDown.value = false;
		}
	},
});
</script>

<style scoped lang="scss">
.input-container {
	position: relative;
	padding: 0px;
}

.new-comment {
	display: block;
	flex-grow: 1;
	width: 100%;
	height: 100%;
	height: var(--input-height);
	min-height: 100px;
	padding: 5px;
	overflow: scroll;
	white-space: pre;
	background-color: var(--background-input);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);
}

.new-comment:focus {
	position: relative;
	overflow: scroll;
	border-color: var(--primary);
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

.buttons {
	position: absolute;
	right: 8px;
	bottom: 8px;

	> * + * {
		margin-left: 8px;
	}
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
