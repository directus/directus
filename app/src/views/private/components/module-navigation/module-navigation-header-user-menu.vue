<script setup lang="ts">
import { addTokenToURL } from '@/api';
import { useUserStore } from '@/stores/user';
import { getRootPath } from '@/utils/get-root-path';
import { storeToRefs } from 'pinia';
import { Ref, computed, ref, unref } from 'vue';
import { useAppStore } from '@/stores/app';
import { User } from '@directus/types';

const appStore = useAppStore();
const userStore = useUserStore();

const { notificationsDrawerOpen } = storeToRefs(appStore);
const { currentUser, fullName } = storeToRefs(userStore);

const avatarURL = computed<string | null>(() => {
	const user = unref(currentUser);

	if (!user || !('avatar' in user) || !user?.avatar) return null;
	return addTokenToURL(`${getRootPath()}assets/${user.avatar.id}?key=system-medium-cover`);
});

const avatarError: Ref<null | Event> = ref(null);

const userProfileLink = computed<string>(() => {
	const id = (unref(currentUser) as User).id;
	return `/users/${id}`;
});
</script>

<template>
	<v-menu placement="bottom-start" show-arrow>
		<template #activator="{ toggle }">
			<v-avatar circle :class="{ 'no-avatar': !avatarURL }" x-small @click="toggle">
				<img
					v-if="avatarURL && !avatarError"
					:src="avatarURL"
					:alt="fullName ?? undefined"
					class="avatar-image"
					@error="avatarError = $event"
				/>
				<v-icon v-else name="account_circle" />
			</v-avatar>
		</template>

		<v-list>
			<v-list-item clickable :to="userProfileLink">
				<v-list-item-icon><v-icon name="account_circle" /></v-list-item-icon>
				<v-list-item-content>Show Profile</v-list-item-content>
			</v-list-item>
			<v-list-item clickable @click="notificationsDrawerOpen = true">
				<v-list-item-icon><v-icon name="notifications" /></v-list-item-icon>
				<v-list-item-content>Notifications</v-list-item-content>
			</v-list-item>
			<v-divider />
			<v-list-item clickable to="/logout">
				<v-list-item-icon><v-icon name="logout" /></v-list-item-icon>
				<v-list-item-content>Log out</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>
