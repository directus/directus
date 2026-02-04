<script setup lang="ts">
import formatTitle from '@directus/format-title';
import type { ClientID } from '@directus/types/collab';
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import type { CollabUser } from '@/composables/use-collab';
import { getAssetUrl } from '@/utils/get-asset-url';

interface Props {
	connected?: boolean | undefined;
	modelValue?: CollabUser[] | CollabUser;
	/** Map of connection IDs to focused field names */
	focuses?: Record<ClientID, string>;
	/** Current user's connection ID */
	currentConnection?: ClientID | null;
}

const DISPLAY_LIMIT = 3;

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
			name: [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined,
			avatar_url: user.avatar?.id
				? getAssetUrl(user.avatar.id, {
						imageKey: 'system-medium-cover',
						cacheBuster: user.avatar.modified_on,
					})
				: undefined,
			color: user.color,
			id: user.id,
			connection: user.connection,
			focusedField: props.focuses?.[user.connection] ?? null,
			isCurrentUser: user.connection === props.currentConnection,
		}))
		.reverse();
});

function focusIntoView(cid: ClientID) {
	const element = document.getElementById(`collab-focus-${cid}`);

	if (element) {
		element.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}
</script>

<template>
	<div class="collab-header">
		<template v-for="(user, index) in users.slice(0, DISPLAY_LIMIT)" :key="user.id">
			<VMenu v-if="!user.isCurrentUser" trigger="hover" show-arrow>
				<template #activator>
					<VAvatar
						:border="`var(--${user.color})`"
						:style="{ zIndex: DISPLAY_LIMIT - index }"
						x-small
						round
						clickable
						@click="focusIntoView(user.connection)"
					>
						<img v-if="user.avatar_url" :src="user.avatar_url" />
						<template v-else-if="user.name">{{ user.name?.substring(0, 1) }}</template>
						<VIcon v-else name="person" small />
					</VAvatar>
				</template>

				<VList class="more-users-list">
					<VListItem>
						<VListItemContent>
							<div class="more-users-list-item-content">
								<span class="more-users-list-item-content-name">{{ user.name }}</span>
								<span class="more-users-list-item-content-status">
									{{ user.focusedField ? t('collab_editing_field', { field: formatTitle(user.focusedField) }) : t('collab_currently_viewing') }}
								</span>
							</div>
						</VListItemContent>
					</VListItem>
				</VList>
			</VMenu>

			<VAvatar v-else :border="`var(--${user.color})`" :style="{ zIndex: DISPLAY_LIMIT - index }" x-small round>
				<img v-if="user.avatar_url" :src="user.avatar_url" />
				<template v-else-if="user.name">{{ user.name?.substring(0, 1) }}</template>
				<VIcon v-else name="person" small />
			</VAvatar>
		</template>

		<VMenu v-if="users.length > DISPLAY_LIMIT" show-arrow>
			<template #activator="{ toggle }">
				<VAvatar v-tooltip.bottom="t('more_users')" class="more-users" x-small round clickable @click="toggle">
					+{{ users.length - 3 }}
				</VAvatar>
			</template>

			<VList class="more-users-list">
				<VListItem
					v-for="user in users.slice(DISPLAY_LIMIT)"
					:key="user.connection"
					clickable
					@click="focusIntoView(user.connection)"
				>
					<VListItemIcon>
						<VAvatar :border="`var(--${user.color})`" x-small round>
							<img v-if="user.avatar_url" :src="user.avatar_url" />
							<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
							<VIcon v-else name="person" small />
						</VAvatar>
					</VListItemIcon>

					<VListItemContent>
						<div class="more-users-list-item-content">
							<span class="more-users-list-item-content-name">{{ user.name }}</span>
							<span class="more-users-list-item-content-status">
								{{ user.focusedField ? t('collab_editing_field', { field: formatTitle(user.focusedField) }) : t('collab_currently_viewing') }}
							</span>
						</div>
					</VListItemContent>
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

	:deep(.v-menu + .v-menu .v-avatar),
	:deep(.v-menu + .v-avatar),
	:deep(.v-avatar + .v-avatar) {
		margin-inline-start: -4px;
	}

	:deep(.v-avatar) {
		font-size: 12px;
	}
}

.v-list-item {
	gap: 8px;
	min-width: 50px;
}

.more-users-list {
	--v-list-min-width: auto;

	&-item-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	&-item-content-name {
		font-weight: 500;
		font-size: 12px;
		line-height: 1.2;
	}

	&-item-content-status {
		font-size: 10px;
		line-height: 1;
		color: var(--theme--foreground-subdued);
	}
}
</style>
