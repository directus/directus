<template>
	<div class="input-container" :class="{ collapsed }">
		<v-menu v-model="showMentionDropDown" attached>
			<template #activator>
				<v-template-input
					ref="commentElement"
					v-model="newCommentContent"
					capture-group="(@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})"
					multiline
					trigger-character="@"
					:items="userPreviews"
					:placeholder="t('leave_comment')"
					@trigger="triggerSearch"
					@deactivate="showMentionDropDown = false"
					@up="pressedUp"
					@down="pressedDown"
					@enter="pressedEnter"
					@focus="focused = true"
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
							<v-image v-if="user.avatar" :src="avatarSource(user.avatar.id)" />
							<v-icon v-else name="person_outline" />
						</v-avatar>
					</v-list-item-icon>

					<v-list-item-content>{{ userName(user) }}</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<div class="buttons">
			<v-button x-small secondary icon class="mention" @click="insertAt">
				<v-icon name="alternate_email" />
			</v-button>

			<v-emoji-picker @click="saveCursorPosition" @emoji-selected="insertText($event)" />

			<div class="spacer"></div>

			<v-button class="cancel" x-small secondary @click="cancel">
				{{ t('cancel') }}
			</v-button>
			<v-button
				:disabled="!newCommentContent || newCommentContent.length === 0 || newCommentContent.trim() === ''"
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

<script setup lang="ts">
import api from '@/api';
import { useShortcut } from '@/composables/use-shortcut';
import { Activity } from '@/types/activity';
import { md } from '@/utils/md';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import { User } from '@directus/types';
import axios, { CancelTokenSource } from 'axios';
import { cloneDeep, throttle } from 'lodash';
import { ComponentPublicInstance, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		refresh: () => void;
		collection: string;
		primaryKey: string | number;
		existingComment?: Activity | null;
		previews?: Record<string, string> | null;
	}>(),
	{
		existingComment: () => null,
		previews: () => null,
	}
);

const emit = defineEmits(['cancel']);

const { t } = useI18n();
const commentElement = ref<ComponentPublicInstance>();
let lastCaretPosition = 0;
let lastCaretOffset = 0;

useShortcut('meta+enter', postComment, commentElement);

const newCommentContent = ref<string | null>(props.existingComment?.comment ?? null);
const focused = ref(false);
const collapsed = computed(() => !newCommentContent.value && !focused.value);

watch(
	() => props.existingComment,
	() => {
		if (props.existingComment?.comment) {
			newCommentContent.value = md(props.existingComment.comment);
		}
	},
	{ immediate: true }
);

const saving = ref(false);
const showMentionDropDown = ref(false);

const searchResult = ref<Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>[]>([]);
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

function cancel() {
	if (props.existingComment) {
		emit('cancel');
	} else {
		newCommentContent.value = '';
		focused.value = false;
	}
}

// Why are selections so weird?
function saveCursorPosition() {
	if (document.getSelection) {
		const selection = document.getSelection();

		if (selection) {
			lastCaretOffset = selection.anchorOffset;

			const range = selection?.getRangeAt(0);
			range?.setStart(commentElement.value?.$el, 0);
			lastCaretPosition = range?.cloneContents().textContent?.length ?? 0;

			selection.removeAllRanges();
		}
	}
}

function insertAt() {
	saveCursorPosition();
	document.getSelection()?.removeAllRanges();
	insertText(' @');
}

function insertText(text: string) {
	if (newCommentContent.value === null) {
		lastCaretPosition = 0;
		newCommentContent.value = '';
	}

	newCommentContent.value = [
		newCommentContent.value.slice(0, lastCaretPosition),
		text,
		newCommentContent.value.slice(lastCaretPosition),
	].join('');

	setTimeout(() => {
		commentElement.value?.$el.focus();
		document.getSelection()?.setPosition(document.getSelection()?.anchorNode ?? null, lastCaretOffset + text.length);

		const inputEvent = new Event('input', { bubbles: true });
		commentElement.value?.$el.dispatchEvent(inputEvent);
	}, 10);
}

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
	return `/assets/${url}?key=system-small-cover`;
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
			title: props.existingComment ? t('post_comment_updated') : t('post_comment_success'),
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
</script>

<style scoped lang="scss">
.input-container {
	position: relative;
	padding: 0px;
}

.v-template-input {
	transition: height var(--fast) var(--transition), padding var(--fast) var(--transition);
}

.collapsed .v-template-input {
	height: 48px;
	padding-bottom: 0px;
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
	margin-top: 4px;
	display: flex;
	gap: 4px;

	.mention,
	.emoji-button {
		--v-button-background-color: transparent;
		--v-button-color: var(--foreground-subdued);
		--v-button-color-hover: var(--primary);
	}

	.cancel {
		--v-button-color: var(--foreground-subdued);
	}

	.post-comment {
		--v-button-background-color-disabled: var(--background-normal-alt);
	}
}

.collapsed:not(:focus) .buttons {
	display: none;
}

.spacer {
	flex-grow: 1;
}

#suggestions {
	display: flex;
	flex-direction: row;
	overflow-x: hidden;
}
</style>
