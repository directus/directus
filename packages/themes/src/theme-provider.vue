<script setup lang="ts">
import type { DeepPartial } from '@directus/types';
import decamelize from 'decamelize';
import { defu } from 'defu';
import { flatten } from 'flat';
import { mapKeys, mapValues } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { computed, unref } from 'vue';
import type { Theme } from './schema.js';
import { useThemeStore } from './store.js';
import { theme as themeDefaultDark, theme as themeDefaultLight } from './themes/directus-light-default.js';

export interface ThemeProviderProps {
	dark?: boolean;
	themeLight?: string;
	themeLightOverrides?: DeepPartial<Theme>;
	themeDark?: string;
	themeDarkOverrides?: DeepPartial<Theme>;
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

	const theme = unref(themes)[props.dark ? 'dark' : 'light'][themeName];

	if (!theme) {
		// eslint-disable-next-line no-console
		console.warn(`Theme "${themeName}" doesn't exist.`);
		return defu(overrides, defaultTheme);
	}

	return defu(overrides, theme, defaultTheme);
});

const cssVariables = computed(() => {
	const getVarName = (name: string) => `--tv--${decamelize(name, { separator: '-' })}`;
	const getRuleName = (name: string) => `--theme--${decamelize(name, { separator: '-' })}`;

	let variables = unref(theme).variables;

	let rules = flatten<Theme['rules'], Record<string, string | number>>(unref(theme).rules, { delimiter: '--' });

	rules = mapKeys(rules, (_value, key) => getRuleName(key));

	rules = mapValues(rules, (value) => {
		if (typeof value === 'string' && value.startsWith('$') && value.substring(1) in variables) {
			return `var(${getVarName(value.substring(1))})`;
		}

		return value;
	});

	variables = mapKeys(variables, (_value, key) => getVarName(key));

	return { ...variables, ...rules };
});
</script>

<template>
	<div class="theme-provider" :style="cssVariables"><slot /></div>
</template>
