import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type { Theme } from './schema.js';
import { theme as themeDirectusLight } from './themes/light-directus.js';
// import { theme as themeDirectusDark } from './themes/dark-directus.js';

const defaultLightThemes: Theme[] = [themeDirectusLight];
const defaultDarkThemes: Theme[] = [/*themeDirectusDark*/];

export const useThemeStore = defineStore('themes', () => {
	const themes = reactive({
		light: Object.fromEntries(defaultLightThemes.map((theme) => [theme.name, theme])),
		dark: Object.fromEntries(defaultDarkThemes.map((theme) => [theme.name, theme])),
	});

	const registerTheme = (theme: Theme) => {
		if (theme.appearance === 'light') {
			themes.light[theme.name] = theme;
		} else {
			themes.dark[theme.name] = theme;
		}
	};

	return { themes, registerTheme };
});
