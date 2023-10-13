<script setup lang="ts">
import type { DeepPartial } from '@directus/types';
import { useHead } from '@unhead/vue';
import decamelize from 'decamelize';
import { flatten } from 'flat';
import { mapKeys } from 'lodash-es';
import { computed, toRefs, unref } from 'vue';
import type { Theme } from './schema.js';
import { theme as themeDefaultDark } from './themes/dark-directus.js';
import { theme as themeDefaultLight } from './themes/light-directus.js';
import { useFonts } from './use-fonts.js';
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

const { googleFonts } = useFonts(theme);

useHead({
	link: computed(() => {
		let fontsImport = '';

		if (googleFonts.value.length > 0) {
			const fontsString = googleFonts.value.join('&family=');
			fontsImport += `https://fonts.googleapis.com/css2?family=${fontsString}`;
			fontsImport += '\n';
		}

		return fontsImport
			? [
					{
						rel: 'stylesheet',
						href: fontsImport,
					},
			  ]
			: [];
	}),
});

const cssString = computed(() => {
	const variables = `:root {${Object.entries(unref(cssVariables))
		.map(([key, value]) => `${key}: ${value};`)
		.join(' ')}}`;

	return variables;
});
</script>

<template>
	<teleport to="#theme">{{ cssString }}</teleport>
</template>
