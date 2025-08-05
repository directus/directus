import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type { Theme } from '@directus/types';
import { dark, light } from '../themes/index.js';

export const useThemeStore = defineStore('🎨 Themes', () => {
	const themes = reactive({ light, dark });

	const registerTheme = (theme: Theme) => {
		if (theme.appearance === 'light') {
			themes.light.push(theme);
		} else {
			themes.dark.push(theme);
		}
	};

	return { themes, registerTheme };
});
