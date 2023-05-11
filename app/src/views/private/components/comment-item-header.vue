<template>
	<div class="comment-header">
		<v-avatar x-small>
			<v-image v-if="avatarSource" :src="avatarSource" :alt="userName(activity.user)" />
			<v-icon v-else name="person_outline" />
		</v-avatar>

		<div class="name">
			<user-popover v-if="activity.user && activity.user.id" :user="activity.user.id">
				<span>
					<template v-if="activity.user && activity.user">
						{{ userName(activity.user) }}
					</template>

					<template v-else>
						{{ t('private_user') }}
					</template>
				</span>
			</user-popover>
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
						<v-list-item-content>{{ t('edit') }}</v-list-item-content>
					</v-list-item>
					<v-list-item clickable @click="confirmDelete = true">
						<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
						<v-list-item-content>{{ t('delete_label') }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
			<v-card>
				<v-card-title>{{ t('delete_comment') }}</v-card-title>
				<v-card-text>{{ t('delete_are_you_sure') }}</v-card-text>

				<v-card-actions>
					<v-button secondary @click="confirmDelete = false">
						{{ t('cancel') }}
					</v-button>
					<v-button kind="danger" :loading="deleting" @click="remove">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import api from '@/api';
import { Activity } from '@/types/activity';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import type { User } from '@directus/types';
import format from 'date-fns/format';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	activity: Activity & {
		display: string;
		user: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
	};
	refresh: () => void;
}>();

defineEmits(['edit']);

const { t } = useI18n();

const formattedTime = computed(() => {
	if (props.activity.timestamp) {
		// timestamp is in iso-8601
		return format(new Date(props.activity.timestamp), String(t('date-fns_time_no_seconds')));
	}

	return null;
});

const avatarSource = computed(() => {
	if (!props.activity.user?.avatar) return null;

	return `/assets/${props.activity.user.avatar.id}?key=system-small-cover`;
});

const { confirmDelete, deleting, remove } = useDelete();

function useDelete() {
	const confirmDelete = ref(false);
	const deleting = ref(false);

	return { confirmDelete, deleting, remove };

	async function remove() {
		deleting.value = true;

		try {
			await api.delete(`/activity/comment/${props.activity.id}`);
			await props.refresh();
			confirmDelete.value = false;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			deleting.value = false;
		}
	}
}
</script>

<style lang="scss" scoped>
.comment-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;

	.v-avatar {
		--v-avatar-color: var(--background-normal-alt);

		flex-basis: 24px;
		margin-right: 8px;

		.v-icon {
			--v-icon-color: var(--foreground-subdued);
		}
	}

	.name {
		flex-grow: 1;
		margin-right: 8px;
		font-weight: 600;
	}

	.header-right {
		position: relative;
		flex-basis: 24px;
		color: var(--foreground-subdued);

		.more {
			cursor: pointer;
			opacity: 0;
			transition: all var(--slow) var(--transition);

			&:hover {
				color: var(--foreground-normal);
			}

			&.active {
				opacity: 1;
			}
		}

		.time {
			position: absolute;
			top: 0;
			right: 0;
			display: flex;
			align-items: center;
			font-size: 12px;
			white-space: nowrap;
			text-align: right;
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
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.dot {
	display: inline-block;
	width: 6px;
	height: 6px;
	margin-right: 4px;
	vertical-align: middle;
	background-color: var(--warning);
	border-radius: 3px;
}
</style>
