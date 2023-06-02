<script setup lang="ts">
import { addTokenToURL } from '@/api';
import { useUserStore } from '@/stores/user';
import { useNotificationsStore } from '@/stores/notifications';
import { getRootPath } from '@/utils/get-root-path';
import { storeToRefs } from 'pinia';
import { Ref, computed, ref, unref } from 'vue';
import { useAppStore } from '@/stores/app';
import { User } from '@directus/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const appStore = useAppStore();
const userStore = useUserStore();
const notificationsStore = useNotificationsStore();

const { notificationsDrawerOpen } = storeToRefs(appStore);
const { currentUser, fullName } = storeToRefs(userStore);
const { unread } = storeToRefs(notificationsStore);

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
	<div class="module-navigation-header-user-menu">
		<v-menu placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<v-badge :value="unread" class="badge" :disabled="unread == 0">
					<v-avatar circle x-small @click="toggle" class="avatar">
						<img
							v-if="avatarURL && !avatarError"
							:src="avatarURL"
							:alt="fullName ?? undefined"
							class="avatar-image"
							@error="avatarError = $event"
						/>
						<v-icon v-else name="account_circle" />
					</v-avatar>
				</v-badge>
			</template>

			<v-list>
				<v-list-item clickable :to="userProfileLink">
					<v-list-item-icon><v-icon name="account_circle" /></v-list-item-icon>
					<v-list-item-content>{{ t('show_profile') }}</v-list-item-content>
				</v-list-item>
				<v-list-item clickable @click="notificationsDrawerOpen = true">
					<v-list-item-icon><v-icon name="notifications" /></v-list-item-icon>
					<v-list-item-content>{{ t('notifications') }}</v-list-item-content>
				</v-list-item>
				<v-divider />
				<v-list-item clickable to="/logout">
					<v-list-item-icon><v-icon name="logout" /></v-list-item-icon>
					<v-list-item-content>{{ t('sign_out') }}</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<style scoped>
.module-navigation-header-user-menu {
	margin-right: 4px;
	cursor: pointer;
}

.avatar:hover {
	outline: 2px solid var(--border-normal);
}

.badge {
	--v-badge-background-color: var(--primary);
}
</style>
