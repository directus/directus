<script setup lang="ts">
import formatTitle from '@directus/format-title';
import type { ClientID } from '@directus/types/collab';
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { COLLAB_USERS_DISPLAY_LIMIT, formatUserAvatar } from './utils';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
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
	const element = document.getElementById(`collab-focus-${cid}`);

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
						clickable
						@click="focusIntoView(user.connection)"
					>
						<img v-if="user.avatar_url" :src="user.avatar_url" />
						<template v-else-if="user.name">{{ user.name?.substring(0, 1) }}</template>
						<VIcon v-else name="person" small />
					</VAvatar>
				</template>

				<div class="collab-header-popover">
					<p class="collab-header-popover-title">
						{{ user.name }}
						<template v-if="user.isCurrentUser">(you)</template>
					</p>
					<p class="collab-header-popover-subtitle">
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

			<div class="collab-header-more-popover">
				<ul>
					<li v-for="user in users.slice(COLLAB_USERS_DISPLAY_LIMIT)" :key="user.connection">
						<button class="collab-header-more-popover-item" @click="focusIntoView(user.connection)">
							<VAvatar :border="`var(--${user.color})`" x-small round>
								<img v-if="user.avatar_url" :src="user.avatar_url" />
								<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
								<VIcon v-else name="person" small />
							</VAvatar>

							<div class="collab-header-more-popover-item-content">
								<span class="collab-header-more-popover-item-content-name">{{ user.name ?? t('unknown_user') }}</span>
								<span class="collab-header-more-popover-item-content-status">
									{{
										user.focusedField
											? t('collab_editing_field', { field: formatTitle(user.focusedField) })
											: t('collab_currently_viewing')
									}}
								</span>
							</div>
						</button>
					</li>
				</ul>
			</div>
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

	&-popover {
		padding: 8px 4px;
		display: flex;
		flex-direction: column;
	}

	&-popover-subtitle {
		font-size: 0.857em;
		line-height: 1.2;
		color: var(--theme--foreground-subdued);
	}
}

.collab-header-more-popover {
	padding: 4px 0;
	min-inline-size: 200px;

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	&-item {
		padding: 4px;
		display: flex;
		align-items: center;
		gap: 8px;
		inline-size: 100%;
	}

	&-item-content {
		padding: 2px 4px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	&-item-content-name {
		line-height: 1.6;
	}

	&-item-content-status {
		font-size: 0.857em;
		line-height: 1.167em;
		color: var(--theme--foreground-subdued);
	}
}
</style>
