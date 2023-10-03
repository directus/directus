import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import type { Settings, User } from '@directus/types';
import { merge } from 'lodash';
import { computed } from 'vue';

export const useTheme = () => {
	const settingsStore = useSettingsStore();
	const userStore = useUserStore();

	return computed(() => {
		let system: Settings | null = null;
		let user: User | null = null;

		if (settingsStore.settings) {
			system = settingsStore.settings;
		}

		if (userStore.currentUser && 'appearance' in userStore.currentUser) {
			user = userStore.currentUser;
		}

		const configuredAppearance = user?.appearance ?? system?.default_appearance ?? 'auto';

		let appearance: 'dark' | 'light';

		if (!configuredAppearance || configuredAppearance === 'auto') {
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				appearance = 'dark';
			}

			appearance = 'light';
		} else {
			appearance = configuredAppearance;
		}

		const themeLight = user?.theme_light ?? system?.default_theme_light;
		const themeDark = user?.theme_dark ?? system?.default_theme_dark;
		const themeLightOverrides = merge({}, user?.theme_light_overrides, system?.theme_light_overrides);
		const themeDarkOverrides = merge({}, user?.theme_dark_overrides, system?.theme_dark_overrides);

		return { appearance, themeLight, themeDark, themeLightOverrides, themeDarkOverrides };
	});
};
