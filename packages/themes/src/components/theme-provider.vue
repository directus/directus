<script setup lang="ts">
import type { DeepPartial } from '@directus/types';
import { useHead } from '@unhead/vue';
import { computed, toRefs, unref } from 'vue';
import { useFonts, useTheme } from '../composables/index.js';
import type { Theme } from '../schemas/index.js';
import { rulesToCssVars } from '../utils/index.js';

import themeDefaultDark from '../themes/dark/default.js';
import themeDefaultLight from '../themes/light/default.js';

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
	},
);

const { darkMode, themeLight, themeDark, themeLightOverrides, themeDarkOverrides } = toRefs(props);

const { theme } = useTheme(darkMode, themeLight, themeDark, themeLightOverrides, themeDarkOverrides);

const cssVariables = computed(() => {
	return rulesToCssVars(unref(theme).rules);
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
