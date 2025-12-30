<script setup lang="ts">
import UserPopover from './user-popover.vue';
import api from '@/api';
import VAvatar from '@/components/v-avatar.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import type { Comment, User } from '@directus/types';
import { format } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

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
		<VAvatar x-small>
			<VImage v-if="avatarSource" :src="avatarSource" :alt="userName(comment.user_created)" />
			<VIcon v-else name="person_outline" />
		</VAvatar>

		<div class="name">
			<UserPopover v-if="comment.user_created && comment.user_created.id" :user="comment.user_created.id">
				<span>
					{{ userName(comment.user_created) }}
				</span>
			</UserPopover>
			<span v-else>
				{{ $t('private_user') }}
			</span>
		</div>

		<div class="header-right">
			<VMenu show-arrow placement="bottom-end">
				<template #activator="{ toggle, active }">
					<VIcon class="more" :class="{ active }" name="more_horiz" clickable @click="toggle" />
					<div class="time">
						{{ formattedTime }}
					</div>
				</template>

				<VList>
					<VListItem clickable @click="$emit('edit')">
						<VListItemIcon><VIcon name="edit" /></VListItemIcon>
						<VListItemContent>{{ $t('edit') }}</VListItemContent>
					</VListItem>
					<VListItem clickable @click="confirmDelete = true">
						<VListItemIcon><VIcon name="delete" /></VListItemIcon>
						<VListItemContent>{{ $t('delete_label') }}</VListItemContent>
					</VListItem>
				</VList>
			</VMenu>
		</div>

		<VDialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="remove">
			<VCard>
				<VCardTitle>{{ $t('delete_comment') }}</VCardTitle>
				<VCardText>{{ $t('delete_are_you_sure') }}</VCardText>

				<VCardActions>
					<VButton secondary @click="confirmDelete = false">
						{{ $t('cancel') }}
					</VButton>
					<VButton kind="danger" :loading="deleting" @click="remove">
						{{ $t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
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
