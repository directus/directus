<script setup lang="ts">
import { ClientID } from '@directus/types/collab';
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { CollabUser } from '@/composables/use-collab';
import { getAssetUrl } from '@/utils/get-asset-url';
import UserPopover from '@/views/private/components/user-popover.vue';

interface Props {
	connected?: boolean | undefined;
	modelValue?: CollabUser[] | CollabUser;
	lock?: boolean;
}

const DISPLAY_LIMIT = 3;

const props = withDefaults(defineProps<Props>(), {
	connected: undefined,
	modelValue: () => [],
	lock: false,
});

const { t } = useI18n();

const users = computed(() => {
	return toArray(props.modelValue)
		.map((user) => ({
			name: user.first_name ? `${user.first_name} ${user.last_name}` : undefined,
			avatar_url: user.avatar?.id
				? getAssetUrl(user.avatar.id, {
						imageKey: 'system-medium-cover',
						cacheBuster: user.avatar.modified_on,
					})
				: undefined,
			color: user.color,
			id: user.id,
			connection: user.connection,
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
	<div class="header-collab">
		<UserPopover v-for="(user, index) in users.slice(0, DISPLAY_LIMIT)" :key="user.id" :user="user.id">
			<VAvatar :border="`var(--${user.color})`" :style="{ zIndex: DISPLAY_LIMIT - index }" x-small round clickable @click="focusIntoView(user.connection)">
				<img v-if="user.avatar_url" :src="user.avatar_url" />
				<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
				<VIcon v-else name="person" small />
			</VAvatar>
		</UserPopover>
		<VMenu v-if="users.length > DISPLAY_LIMIT" show-arrow>
			<template #activator="{ toggle }">
				<VAvatar v-tooltip.bottom="t('more_users')" class="more-users" x-small round clickable @click="toggle">+{{ users.length - 3 }}</VAvatar>
			</template>
			<VList>
				<VListItem v-for="(user, index) in users.slice(DISPLAY_LIMIT)" :key="user.connection" clickable @click="focusIntoView(user.connection)">
					<VAvatar :border="`var(--${user.color})`" x-small round :class="{ 'first': index === 0 }" @click="focusIntoView(user.connection)">
						<img v-if="user.avatar_url" :src="user.avatar_url" />
						<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
						<VIcon v-else name="person" />
					</VAvatar>

					<div class="user-name">{{ user.name ?? t('unknown_user') }}</div>
				</VListItem>
			</VList>
		</VMenu>
		<VIcon
			v-if="lock && users.length > 0"
			name="lock"
			class="lock-icon"
			:style="{ color: `var(--${users[0]!.color})` }"
		/>
		<VIcon
			v-if="connected === false"
			v-tooltip.bottom="$t('collab_disconnected')"
			name="signal_disconnected"
			class="connect-icon"
		/>
	</div>
</template>

<style scoped lang="scss">
.header-collab {
	display: flex;
	align-items: center;

	.user-name {
		margin-inline-start: 8px;
	}

	& > * + * .v-avatar {
		margin-inline-start: -4px;
	}

	.v-avatar {
		/* Font-size used by "more users" button */
		font-size: 12px;
		cursor: pointer;
	}
}

.v-list-item {
	display: flex;
	gap: 8px;
}

.lock-icon {
	align-self: center;
	font-size: 14px;
	color: var(--text-50);
}
</style>
