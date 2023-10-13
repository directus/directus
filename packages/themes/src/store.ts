import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type { Theme } from './schema.js';
import { theme as themeDirectusDark } from './themes/dark-directus.js';
import { theme as themeDirectusLight } from './themes/light-directus.js';

const defaultLightThemes: Theme[] = [themeDirectusLight];
const defaultDarkThemes: Theme[] = [themeDirectusDark];

export const useThemeStore = defineStore('🎨 Themes', () => {
	const themes = reactive({
		light: defaultLightThemes,
		dark: defaultDarkThemes,
	});

	const registerTheme = (theme: Theme) => {
		if (theme.appearance === 'light') {
			themes.light.push(theme);
		} else {
			themes.dark.push(theme);
		}
	};

	return { themes, registerTheme };
});
