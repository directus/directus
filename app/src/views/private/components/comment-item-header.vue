<script setup lang="ts">
import api from '@/api';
import { getAssetUrl } from '@/utils/get-asset-url';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import type { Comment, User } from '@directus/types';
import { format } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UserPopover from './user-popover.vue';
import VAvatar from '@/components/v-avatar.vue';
import VButton from '@/components/v-button.vue';
import VCard from '@/components/v-card.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VList from '@/components/v-list.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VMenu from '@/components/v-menu.vue';

const props = defineProps<{
	comment: Comment & {
		display: string;
		user_created: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
	};
	refresh: () => Promise<void>;
}>();

defineEmits(['edit']);

const { t } = useI18n();

const formattedTime = computed(() => {
	if (props.comment.date_created) {
		// timestamp is in iso-8601
		return format(new Date(props.comment.date_created), String(t('date-fns_time_no_seconds')));
	}

	return null;
});

const avatarSource = computed(() => {
	if (!props.comment.user_created?.avatar) return null;

	return getAssetUrl(props.comment.user_created.avatar.id, {
		imageKey: 'system-small-cover',
		cacheBuster: props.comment.user_created.avatar.modified_on,
	});
});

const { confirmDelete, deleting, remove } = useDelete();

function useDelete() {
	const confirmDelete = ref(false);
	const deleting = ref(false);

	return { confirmDelete, deleting, remove };

	async function remove() {
		if (deleting.value) return;

		deleting.value = true;

		try {
			await api.delete(`/comments/${props.comment.id}`);
			await props.refresh();
			confirmDelete.value = false;
		} catch (error) {
			unexpectedError(error);
		} finally {
			deleting.value = false;
		}
	}
}
</script>

<template>
	<div class="comment-header">
		<v-avatar x-small>
			<v-image v-if="avatarSource" :src="avatarSource" :alt="userName(comment.user_created)" />
			<v-icon v-else name="person_outline" />
		</v-avatar>

		<div class="name">
			<user-popover v-if="comment.user_created && comment.user_created.id" :user="comment.user_created.id">
				<span>
					{{ userName(comment.user_created) }}
				</span>
			</user-popover>
			<span v-else>
				{{ $t('private_user') }}
			</span>
		</div>

		<div class="header-right">
			<v-menu show-arrow placement="bottom-end">
				<template #activator="{ toggle, active }">
					<v-icon class="more" :class="{ active }" name="more_horiz" clickable @click="toggle" />
					<div class="time">
						{{ formattedTime }}
					</div>
				</template>

				<v-list>
					<v-list-item clickable @click="$emit('edit')">
						<v-list-item-icon><v-icon name="edit" /></v-list-item-icon>
						<v-list-item-content>{{ $t('edit') }}</v-list-item-content>
					</v-list-item>
					<v-list-item clickable @click="confirmDelete = true">
						<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
						<v-list-item-content>{{ $t('delete_label') }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<v-dialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="remove">
			<v-card>
				<v-card-title>{{ $t('delete_comment') }}</v-card-title>
				<v-card-text>{{ $t('delete_are_you_sure') }}</v-card-text>

				<v-card-actions>
					<v-button secondary @click="confirmDelete = false">
						{{ $t('cancel') }}
					</v-button>
					<v-button kind="danger" :loading="deleting" @click="remove">
						{{ $t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="scss" scoped>
.comment-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-block-end: 8px;

	.v-avatar {
		--v-avatar-color: var(--theme--background-accent);

		flex-basis: 24px;
		margin-inline-end: 8px;

		.v-icon {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}

	.name {
		flex-grow: 1;
		margin-inline-end: 8px;
		font-weight: 600;
	}

	.header-right {
		position: relative;
		flex-basis: 24px;
		color: var(--theme--foreground-subdued);

		.more {
			cursor: pointer;
			opacity: 0;
			transition: all var(--slow) var(--transition);

			&:hover {
				color: var(--theme--foreground);
			}

			&.active {
				opacity: 1;
			}
		}

		.time {
			position: absolute;
			inset-block-start: 0;
			inset-inline-end: 0;
			display: flex;
			align-items: center;
			font-size: 12px;
			white-space: nowrap;
			text-align: end;
			text-transform: lowercase;
			opacity: 1;
			transition: opacity var(--slow) var(--transition);
			pointer-events: none;
		}

		.more.active + .time {
			opacity: 0;
		}
	}
}

.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--theme--danger);
}

.dot {
	display: inline-block;
	inline-size: 6px;
	block-size: 6px;
	margin-inline-end: 4px;
	vertical-align: middle;
	background-color: var(--theme--warning);
	border-radius: 3px;
}
</style>
