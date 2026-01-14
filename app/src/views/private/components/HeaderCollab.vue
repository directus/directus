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

interface Props {
	connected?: boolean | undefined;
	modelValue?: CollabUser[] | CollabUser;
	xSmall?: boolean;
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
			id: user.connection,
		}))
		.reverse();
});

const focusId = computed(() => {
	if (users.value.length === 0) return null;
	return `collab-focus-${users.value[0]!.id}`;
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
		<VMenu v-if="users.length > DISPLAY_LIMIT" trigger="click">
			<template #activator>
				<VAvatar v-tooltip.bottom="t('more_users')" class="more-users" x-small round>+{{ users.length - 3 }}</VAvatar>
			</template>
			<VList>
				<VListItem v-for="user in users.slice(DISPLAY_LIMIT)" :key="user.id" clickable @click="focusIntoView(user.id)">
					<VAvatar :border="`var(--${user.color})`" x-small round>
						<img v-if="user.avatar_url" :src="user.avatar_url" />
						<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
						<VIcon v-else name="person" />
					</VAvatar>

					<div class="user-name">{{ user.name ?? t('unknown_user') }}</div>
				</VListItem>
			</VList>
		</VMenu>
		<VAvatar
			v-for="user in users.slice(0, DISPLAY_LIMIT)"
			:id="focusId"
			:key="user.id"
			v-tooltip.bottom="user.name ?? t('unknown_user')"
			:border="`var(--${user.color})`"
			x-small
			round
			@click="focusIntoView(user.id)"
		>
			<img v-if="user.avatar_url" :src="user.avatar_url" />
			<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
			<VIcon v-else name="person" />
		</VAvatar>
	</div>
</template>

<style scoped>
.header-collab {
	display: flex;
	flex-direction: row-reverse;

	.user-name {
		margin-inline-start: 8px;
	}
}

.v-avatar {
	margin-inline-start: -4px;
	font-size: 12px;
	cursor: pointer;
}

.v-list-item {
	cursor: pointer;
	display: flex;
	gap: 8px;
}

.lock-icon {
	align-self: center;
	font-size: 14px;
	color: var(--text-50);
}
</style>
