<script setup lang="ts">
import type { ClientID } from '@directus/types/collab';
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import type { CollabUser } from '@/composables/use-collab';
import { getAssetUrl } from '@/utils/get-asset-url';

interface Props {
	connected?: boolean | undefined;
	modelValue?: CollabUser[] | CollabUser;
	/** Whether the component is used on the header or the field */
	type?: 'header' | 'field';
}

const DISPLAY_LIMIT = 3;

const props = withDefaults(defineProps<Props>(), {
	connected: undefined,
	modelValue: () => [],
	type: 'header',
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
			focusId: focusId(user.connection),
		}))
		.reverse();

	function focusId(cid: ClientID) {
		if (props.type === 'field') return `collab-focus-${cid}`;
		return null;
	}
});

function focusIntoView(cid: ClientID) {
	const element = document.getElementById(`collab-focus-${cid}`);

	if (element) {
		element.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}
</script>

<template>
	<div class="collab-avatars" :class="{ 'is-field': type === 'field' }">
		<VAvatar
			v-for="(user, index) in users.slice(0, DISPLAY_LIMIT)"
			:id="user.focusId"
			:key="user.id"
			v-tooltip.bottom="user.name ?? t('unknown_user')"
			:border="`var(--${user.color})`"
			:style="{ zIndex: DISPLAY_LIMIT - index }"
			x-small
			round
			:clickable="type === 'header'"
			@click="type === 'header' && focusIntoView(user.connection)"
		>
			<img v-if="user.avatar_url" :src="user.avatar_url" />
			<template v-else-if="user.name">{{ user.name.substring(0, 1) }}</template>
			<VIcon v-else name="person" small />
		</VAvatar>

		<VMenu v-if="users.length > DISPLAY_LIMIT" show-arrow>
			<template #activator="{ toggle }">
				<VAvatar v-tooltip.bottom="t('more_users')" class="more-users" x-small round clickable @click="toggle">
					+{{ users.length - 3 }}
				</VAvatar>
			</template>

			<VList>
				<VListItem
					v-for="user in users.slice(DISPLAY_LIMIT)"
					:key="user.connection"
					:clickable="type === 'header'"
					@click="type === 'header' && focusIntoView(user.connection)"
				>
					<VAvatar :border="`var(--${user.color})`" x-small round>
						<img v-if="user.avatar_url" :src="user.avatar_url" />
						<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
						<VIcon v-else name="person" small />
					</VAvatar>

					<div class="user-name">{{ user.name }}</div>
				</VListItem>
			</VList>
		</VMenu>

		<VIcon
			v-if="connected === false"
			v-tooltip.bottom="$t('collab_disconnected')"
			name="signal_disconnected"
			class="connect-icon"
		/>

		<VIcon
			v-if="type === 'field' && users.length > 0"
			name="lock"
			class="lock-icon"
			:style="{ color: `var(--${users[0]!.color})` }"
		/>
	</div>
</template>

<style scoped lang="scss">
.collab-avatars {
	display: flex;
	align-items: center;

	.user-name {
		margin-inline-start: 8px;
	}

	.v-avatar + .v-avatar,
	.more-users {
		margin-inline-start: -4px;
	}

	&.is-field,
	&.is-field button:not(.more-users) {
		cursor: default;
	}
}

.v-avatar {
	/* Used by users without avatar and "more users" button */
	font-size: 12px;
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
