import type { User } from '@directus/types';
import { merge } from 'lodash';
import { computed, ref } from 'vue';
import type { Info } from '@/stores/server';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';

export const useThemeConfiguration = () => {
	const serverStore = useServerStore();
	const userStore = useUserStore();

	const browserAppearance = ref<'dark' | 'light'>(
		window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
	);

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
		browserAppearance.value = matches ? 'dark' : 'light';
	});

	const systemSettings = computed(() => {
		let system: Info['project'] | null = null;

		if (serverStore.info?.project) {
			system = serverStore.info.project;
		}

		return system;
	});

	const userSettings = computed(() => {
		let user: User | null = null;

		if (userStore.currentUser && 'appearance' in userStore.currentUser) {
			user = userStore.currentUser;
		}

		return user;
	});

	const configuredAppearance = computed(() => {
		return userSettings.value?.appearance ?? systemSettings.value?.default_appearance ?? 'auto';
	});

	const appearance = computed(() => {
		if (!configuredAppearance.value || configuredAppearance.value === 'auto') {
			return browserAppearance.value;
		}

		return configuredAppearance.value;
	});

	const darkMode = computed(() => appearance.value === 'dark');

	const themeLight = computed(
		() => userSettings.value?.theme_light ?? systemSettings.value?.default_theme_light ?? null,
	);

	const themeDark = computed(() => userSettings.value?.theme_dark ?? systemSettings.value?.default_theme_dark ?? null);

	const themeLightOverrides = computed(() =>
		merge({}, userSettings.value?.theme_light_overrides, systemSettings.value?.theme_light_overrides),
	);

	const themeDarkOverrides = computed(() =>
		merge({}, userSettings.value?.theme_dark_overrides, systemSettings.value?.theme_dark_overrides),
	);

	return { darkMode, themeLight, themeDark, themeLightOverrides, themeDarkOverrides };
};
