import type { DeepPartial } from '@directus/types';
import { merge } from 'lodash-es';
import { storeToRefs } from 'pinia';
import type { MaybeRef } from 'vue';
import { computed, unref } from 'vue';
import type { Theme } from './schema.js';
import { useThemeStore } from './store.js';
import { theme as themeDefaultDark } from './themes/dark-directus.js';
import { theme as themeDefaultLight } from './themes/light-directus.js';

export const useTheme = (
	darkMode: MaybeRef<boolean>,
	themeLight: MaybeRef<string | null>,
	themeDark: MaybeRef<string | null>,
	themeLightOverrides: MaybeRef<DeepPartial<Theme['rules']>>,
	themeDarkOverrides: MaybeRef<DeepPartial<Theme['rules']>>
) => {
	const { themes } = storeToRefs(useThemeStore());

	const theme = computed(() => {
		const themeName = unref(darkMode) ? unref(themeDark) : unref(themeLight);
		const defaultTheme = unref(darkMode) ? themeDefaultDark : themeDefaultLight;
		const overrides = unref(darkMode) ? unref(themeDarkOverrides) : unref(themeLightOverrides);

		const theme = unref(themes)[darkMode ? 'dark' : 'light'].find((theme) => theme.name === themeName);

		if (!theme) {
			if (themeName && themeName !== defaultTheme.name) {
				// eslint-disable-next-line no-console
				console.warn(`Theme "${themeName}" doesn't exist.`);
			}

			return overrides ? merge({}, defaultTheme, { rules: overrides }) : defaultTheme;
		}

		return overrides ? merge({}, defaultTheme, theme, { rules: overrides }) : merge(defaultTheme, theme);
	});

	return { theme };
};
