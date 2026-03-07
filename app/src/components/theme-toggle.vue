<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { useUserStore } from '@/stores/user';

type AppearanceMode = 'light' | 'dark' | 'auto';

const { t } = useI18n();
const userStore = useUserStore();

const themeOptions = computed<{ value: AppearanceMode; label: string; icon: string }[]>(() => [
	{ value: 'light', label: t('appearance_light'), icon: 'light_mode' },
	{ value: 'dark', label: t('appearance_dark'), icon: 'dark_mode' },
	{ value: 'auto', label: t('appearance_auto'), icon: 'brightness_auto' },
]);

const currentAppearance = computed<AppearanceMode>(() => {
	if (userStore.currentUser && 'appearance' in userStore.currentUser) {
		const val = userStore.currentUser.appearance;
		if (val === 'light' || val === 'dark') return val;
	}

	return 'auto';
});

const currentIcon = computed(() => {
	const match = themeOptions.value.find((o) => o.value === currentAppearance.value);
	return match?.icon ?? 'brightness_auto';
});

async function setAppearance(mode: AppearanceMode) {
	if (!userStore.currentUser || !('appearance' in userStore.currentUser)) return;

	const previousAppearance = userStore.currentUser.appearance;
	const apiValue = mode === 'auto' ? null : mode;

	userStore.currentUser.appearance = apiValue;

	try {
		await api.patch('/users/me', { appearance: apiValue });
	} catch {
		userStore.currentUser.appearance = previousAppearance;
	}
}
</script>

<template>
	<VMenu placement="top-start" show-arrow>
		<template #activator="{ toggle }">
			<VButton v-tooltip.right="t('appearance')" tile icon x-large class="theme-toggle-button" @click="toggle">
				<VIcon :name="currentIcon" />
			</VButton>
		</template>

		<VList>
			<VListItem
				v-for="option in themeOptions"
				:key="option.value"
				clickable
				:active="currentAppearance === option.value"
				@click="setAppearance(option.value)"
			>
				<VListItemIcon><VIcon :name="option.icon" /></VListItemIcon>
				<VListItemContent>{{ option.label }}</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.theme-toggle-button {
	--v-button-color: var(--theme--navigation--modules--button--foreground);
	--v-button-color-hover: var(--theme--navigation--modules--button--foreground-hover);
	--v-button-background-color: var(--theme--navigation--modules--background);
	--v-button-background-color-hover: var(--theme--navigation--modules--background);
}
</style>
