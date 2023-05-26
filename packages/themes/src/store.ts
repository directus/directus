import { defu } from 'defu';
import { defineStore } from 'pinia';
import { computed, reactive, ref, unref } from 'vue';
import type { Theme } from './schema.js';
import darkDefault from './themes/dark/default.js';
import lightDefault from './themes/light/default.js';

export const useThemeStore = defineStore('themes', () => {
	const currentAppearance = ref<'light' | 'dark'>('light');

	const currentTheme = reactive({
		dark: darkDefault.name,
		light: lightDefault.name,
	});

	const themes = reactive({
		dark: [darkDefault] as Theme[],
		light: [lightDefault] as Theme[],
	});

	const registerTheme = (theme: Theme) => {
		if (theme.appearance === 'dark') {
			themes.dark.push(theme);
		} else {
			themes.light.push(theme);
		}
	};

	const rules = computed(() => {
		const appearance = unref(currentAppearance);
		const theme = themes[appearance].find(({ name }) => name === currentTheme[unref(currentAppearance)]);

		return defu(theme?.rules, lightDefault.rules);
	});

	return { themes, registerTheme, currentTheme, currentAppearance, rules };
});
