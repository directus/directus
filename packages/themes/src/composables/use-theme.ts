import type { DeepPartial, Theme } from '@directus/types';
import { merge } from 'lodash-es';
import { storeToRefs } from 'pinia';
import type { MaybeRef } from 'vue';
import { computed, unref } from 'vue';
import { useThemeStore } from '../stores/theme.js';
import themeDefaultDark from '../themes/dark/default.js';
import themeDefaultLight from '../themes/light/default.js';

export const useTheme = (
	darkMode: MaybeRef<boolean>,
	themeLight: MaybeRef<string | null>,
	themeDark: MaybeRef<string | null>,
	themeLightOverrides: MaybeRef<DeepPartial<Theme['rules']>>,
	themeDarkOverrides: MaybeRef<DeepPartial<Theme['rules']>>,
) => {
	const { themes } = storeToRefs(useThemeStore());

	const theme = computed(() => {
		const themeId = unref(darkMode) ? unref(themeDark) : unref(themeLight);
		const defaultTheme = unref(darkMode) ? themeDefaultDark : themeDefaultLight;
		const overrides = unref(darkMode) ? unref(themeDarkOverrides) : unref(themeLightOverrides);

		const theme = unref(themes)[unref(darkMode) ? 'dark' : 'light'].find((theme) => theme.id === themeId);

		if (!theme) {
			if (themeId && themeId !== defaultTheme.id) {
				// eslint-disable-next-line no-console
				console.warn(`Theme "${themeId}" doesn't exist.`);
			}

			return overrides ? merge({}, defaultTheme, { rules: overrides }) : defaultTheme;
		}

		return overrides ? merge({}, defaultTheme, theme, { rules: overrides }) : merge(defaultTheme, theme);
	});

	return { theme };
};
