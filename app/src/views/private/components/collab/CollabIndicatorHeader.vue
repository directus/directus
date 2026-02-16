<script setup lang="ts">
import formatTitle from '@directus/format-title';
import type { ClientID } from '@directus/types/collab';
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { COLLAB_USERS_DISPLAY_LIMIT, formatUserAvatar, getFocusId } from './utils';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import type { CollabUser } from '@/composables/use-collab';

interface Props {
	connected?: boolean | undefined;
	modelValue?: CollabUser[] | CollabUser;
	/** Map of connection IDs to focused field names */
	focuses?: Record<ClientID, string>;
	/** Current user's connection ID */
	currentConnection?: ClientID | null;
}

const props = withDefaults(defineProps<Props>(), {
	connected: undefined,
	modelValue: () => [],
	focuses: () => ({}),
	currentConnection: null,
});

const { t } = useI18n();

const users = computed(() => {
	return toArray(props.modelValue)
		.map((user) => ({
			...formatUserAvatar(user),
			focusedField: props.focuses?.[user.connection] ?? null,
			isCurrentUser: user.connection === props.currentConnection,
		}))
		.reverse();
});

function focusIntoView(cid: ClientID) {
	const element = document.getElementById(getFocusId(cid));

	if (element) {
		element.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}
</script>

<template>
	<div class="collab-header">
		<template v-for="(user, index) in users.slice(0, COLLAB_USERS_DISPLAY_LIMIT)" :key="user.id">
			<VMenu trigger="hover" show-arrow invert>
				<template #activator>
					<VAvatar
						:border="`var(--${user.color})`"
						:style="{ zIndex: COLLAB_USERS_DISPLAY_LIMIT - index }"
						x-small
						round
						:clickable="!!user.focusedField"
						@click="user.focusedField && focusIntoView(user.connection)"
					>
						<img v-if="user.avatar_url" :src="user.avatar_url" />
						<template v-else-if="user.name">{{ user.name?.substring(0, 1) }}</template>
						<VIcon v-else name="person" small />
					</VAvatar>
				</template>

				<div class="collab-header-popover">
					<p>
						{{ user.name ?? t('unknown_user') }}
						<template v-if="user.isCurrentUser">{{ t('collab_you') }}</template>
					</p>
					<p class="collab-header-popover-status">
						{{
							user.focusedField
								? t('collab_editing_field', { field: formatTitle(user.focusedField) })
								: t('collab_currently_viewing')
						}}
					</p>
				</div>
			</VMenu>
		</template>

		<VMenu v-if="users.length > COLLAB_USERS_DISPLAY_LIMIT" show-arrow>
			<template #activator="{ toggle }">
				<VAvatar v-tooltip.bottom="t('more_users')" class="more-users" x-small round clickable @click="toggle">
					+{{ users.length - COLLAB_USERS_DISPLAY_LIMIT }}
				</VAvatar>
			</template>

			<VList>
				<VListItem
					v-for="user in users.slice(COLLAB_USERS_DISPLAY_LIMIT)"
					:key="user.connection"
					class="collab-header-more-popover-item"
					:clickable="!!user.focusedField"
					@click="!user.focusedField ? undefined : focusIntoView(user.connection)"
				>
					<VAvatar :border="`var(--${user.color})`" x-small round>
						<img v-if="user.avatar_url" :src="user.avatar_url" />
						<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
						<VIcon v-else name="person" small />
					</VAvatar>

					<div class="collab-header-more-popover-item-content">
						<span>{{ user.name ?? t('unknown_user') }}</span>
						<span class="collab-header-popover-status">
							{{
								user.focusedField
									? t('collab_editing_field', { field: formatTitle(user.focusedField) })
									: t('collab_currently_viewing')
							}}
						</span>
					</div>
				</VListItem>
			</VList>
		</VMenu>

		<VIcon
			v-if="connected === false"
			v-tooltip.bottom="$t('collab_disconnected')"
			name="signal_disconnected"
			class="connect-icon"
		/>
	</div>
</template>

<style scoped lang="scss">
.collab-header {
	display: flex;
	align-items: center;

	:deep(.v-menu + .v-menu .v-avatar) {
		margin-inline-start: -4px;
	}

	:deep(.v-avatar) {
		font-size: 12px;
	}
}

.collab-header-popover {
	padding: 4px;
	padding-block-end: 7px;
	display: flex;
	flex-direction: column;
}

.collab-header-popover-status {
	font-size: 0.857em;
	line-height: 1.2;
	color: var(--theme--foreground-subdued);
}

.collab-header-more-popover-item {
	padding-block: 4px;
	display: flex;
	align-items: center;
	gap: 8px;

	.collab-header-more-popover-item-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>
