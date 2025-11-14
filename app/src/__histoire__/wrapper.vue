<script setup lang="ts">
import { rulesToCssVars, useTheme } from '@directus/themes';
import { useMutationObserver } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import '@/styles/_variables.scss';
import { loadStores } from './stores';

const isIframe = window.self !== window.top;
const topHtmlElement = window.top?.document.documentElement;
const iframe = window.self.document;

loadStores();

if (isIframe && topHtmlElement) {
	iframe.documentElement.classList.add('custom-html');

	for (const teleportTargetId of ['dialog-outlet', 'menu-outlet']) {
		const existingElement = window.self.document.getElementById(teleportTargetId);
		if (existingElement) continue;

		const element = document.createElement('div');
		element.setAttribute('id', teleportTargetId);
		iframe.body.appendChild(element);
	}

	const darkMode = ref(topHtmlElement.classList.contains('htw-dark'));

	useMutationObserver(
		topHtmlElement,
		(mutations) => {
			const isClassMutation = mutations.some((mutation) => mutation.attributeName == 'class');

			if (!isClassMutation) return;

			const hasDarkModeClass = topHtmlElement.classList.contains('htw-dark');

			if (hasDarkModeClass !== darkMode.value) {
				darkMode.value = hasDarkModeClass;
			}
		},
		{ attributes: true },
	);

	watch(
		darkMode,
		(value) => {
			iframe.body.classList.add(value ? 'dark' : 'light');
			iframe.body.classList.remove(value ? 'light' : 'dark');
		},
		{ immediate: true },
	);

	const { theme } = useTheme(darkMode, null, null, {}, {});

	const cssString = computed(() => {
		const cssVariables = rulesToCssVars(theme.value.rules);

		cssVariables['--project-color'] = '#6644ff';

		const variables = `:root {${Object.entries(cssVariables)
			.map(([key, value]) => `${key}: ${value};`)
			.join(' ')}}`;

		return variables;
	});

	watch(
		cssString,
		(value) => {
			const existingStyle = window.self.document.querySelector('head > style#theme');

			if (existingStyle) {
				existingStyle.textContent = value;
			} else {
				const style = document.createElement('style');
				style.setAttribute('id', 'theme');
				style.textContent = value;
				window.self.document.head.appendChild(style);
			}
		},
		{ immediate: true },
	);
}
</script>

<template>
	<div class="custom-wrapper">
		<slot />
	</div>
</template>

<style lang="scss">
@use 'sass:meta';

.custom-html {
	@include meta.load-css('@/styles/main');
}

.histoire-generic-render-story:not(.__histoire-render-custom-controls) .custom-wrapper {
	padding: 24px;
}
</style>
