<script setup lang="ts">
import type { DeepPartial } from '@directus/types';
import decamelize from 'decamelize';
import { flatten } from 'flat';
import { mapKeys } from 'lodash-es';
import { computed, toRefs, unref } from 'vue';
import type { Theme } from './schema.js';
// import { theme as themeDefaultDark } from './themes/dark-directus.js';
import { theme as themeDefaultDark, theme as themeDefaultLight } from './themes/light-directus.js';
import { useTheme } from './use-theme.js';

const props = withDefaults(
	defineProps<{
		darkMode: boolean;
		themeLight: string | null;
		themeLightOverrides: DeepPartial<Theme['rules']>;
		themeDark: string | null;
		themeDarkOverrides: DeepPartial<Theme['rules']>;
	}>(),
	{
		themeLight: themeDefaultLight.name,
		themeDark: themeDefaultDark.name,
		themeLightOverrides: () => ({}),
		themeDarkOverrides: () => ({}),
	}
);

const { darkMode, themeLight, themeDark, themeLightOverrides, themeDarkOverrides } = toRefs(props);

const { theme } = useTheme(darkMode, themeLight, themeDark, themeLightOverrides, themeDarkOverrides);

const cssVariables = computed(() => {
	const rules = flatten<Theme['rules'], Record<string, string | number>>(unref(theme).rules, { delimiter: '--' });

	const getRuleName = (name: string) => `--theme--${decamelize(name, { separator: '-' })}`;

	return mapKeys(rules, (_value, key) => getRuleName(key));
});

const cssString = computed(() => {
	return `:root {${Object.entries(unref(cssVariables))
		.map(([key, value]) => `${key}: ${value};`)
		.join(' ')}}`;
});
</script>

<template>
	<teleport to="#theme">{{ cssString }}</teleport>
</template>
