<script setup lang="ts">
import { addTokenToURL } from '@/api';
import { useUserStore } from '@/stores/user';
import { getRootPath } from '@/utils/get-root-path';
import { storeToRefs } from 'pinia';
import { Ref, computed, ref, unref } from 'vue';

const userStore = useUserStore();

const { currentUser, fullName } = storeToRefs(userStore);

const avatarURL = computed<string | null>(() => {
	const user = unref(currentUser);

	if (!user || !('avatar' in user) || !user?.avatar) return null;
	return addTokenToURL(`${getRootPath()}assets/${user.avatar.id}?key=system-medium-cover`);
});

const avatarError: Ref<null | Event> = ref(null);
</script>

<template>
	<v-avatar :class="{ 'no-avatar': !avatarURL }">
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
