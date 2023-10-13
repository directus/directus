import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import type { Settings, User } from '@directus/types';
import { merge } from 'lodash';
import { computed } from 'vue';

export const useThemeConfiguration = () => {
	const settingsStore = useSettingsStore();
	const userStore = useUserStore();

	const systemSettings = computed(() => {
		let system: Settings | null = null;

		if (settingsStore.settings) {
			system = settingsStore.settings;
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
		let appearance: 'dark' | 'light';

		if (!configuredAppearance.value || configuredAppearance.value === 'auto') {
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				appearance = 'dark';
			}

			appearance = 'light';
		} else {
			appearance = configuredAppearance.value;
		}

		return appearance;
	});

	const darkMode = computed(() => appearance.value === 'dark');

	const themeLight = computed(
		() => userSettings.value?.theme_light ?? systemSettings.value?.default_theme_light ?? null
	);

	const themeDark = computed(() => userSettings.value?.theme_dark ?? systemSettings.value?.default_theme_dark ?? null);

	const themeLightOverrides = computed(() =>
		merge({}, userSettings.value?.theme_light_overrides, systemSettings.value?.theme_light_overrides)
	);

	const themeDarkOverrides = computed(() =>
		merge({}, userSettings.value?.theme_dark_overrides, systemSettings.value?.theme_dark_overrides)
	);

	return { darkMode, themeLight, themeDark, themeLightOverrides, themeDarkOverrides };
};
