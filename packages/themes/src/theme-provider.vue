<script setup lang="ts">
import type { DeepPartial } from '@directus/types';
import decamelize from 'decamelize';
import { flatten } from 'flat';
import { mapKeys, merge } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { computed, unref } from 'vue';
import type { Theme } from './schema.js';
import { useThemeStore } from './store.js';
// import { theme as themeDefaultDark } from './themes/dark-directus.js';
import { theme as themeDefaultDark, theme as themeDefaultLight } from './themes/light-directus.js';

export interface ThemeProviderProps {
	dark: boolean;
	themeLight: string | null;
	themeLightOverrides: DeepPartial<Theme['rules']>;
	themeDark: string | null;
	themeDarkOverrides: DeepPartial<Theme['rules']>;
}

const props = withDefaults(defineProps<ThemeProviderProps>(), {
	themeLight: themeDefaultLight.name,
	themeDark: themeDefaultDark.name,
	themeLightOverrides: () => ({}),
	themeDarkOverrides: () => ({}),
});

const { themes } = storeToRefs(useThemeStore());

const theme = computed(() => {
	const themeName = props.dark ? props.themeDark : props.themeLight;
	const defaultTheme = props.dark ? themeDefaultDark : themeDefaultLight;
	const overrides = props.dark ? props.themeDarkOverrides : props.themeLightOverrides;

	const theme = unref(themes)[props.dark ? 'dark' : 'light'].find((theme) => theme.name === themeName);

	if (!theme) {
		// eslint-disable-next-line no-console
		console.warn(`Theme "${themeName}" doesn't exist.`);
		return merge(defaultTheme, overrides);
	}

	return merge(defaultTheme, theme, overrides);
});

const cssVariables = computed(() => {
	const rules = flatten<Theme['rules'], Record<string, string | number>>(unref(theme).rules, { delimiter: '--' });

	const getRuleName = (name: string) => `--theme--${decamelize(name, { separator: '-' })}`;

	return mapKeys(rules, (_value, key) => getRuleName(key));
});

const cssString = computed(() => {
	return `:root {${Object.entries(unref(cssVariables)).map(([key, value]) => `${key}: ${value};`).join(' ')}}`;
});
</script>

<template>
	<teleport to="#theme">{{ cssString }}</teleport>
</template>
