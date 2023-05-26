import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type { Theme } from './schema.js';
import darkDefault from './themes/dark/default.js';
import lightDefault from './themes/light/default.js';

export const useThemeStore = defineStore('themes', () => {
	const current = reactive({
		dark: darkDefault.name,
		light: lightDefault.name,
	});

	const themes = reactive({
		dark: [] as Theme[],
		light: [lightDefault] as Theme[],
	});

	const registerTheme = (theme: Theme) => {
		if (theme.type === 'dark') {
			themes.dark.push(theme);
		} else {
			themes.light.push(theme);
		}
	};

	return { themes, registerTheme, current };
});
