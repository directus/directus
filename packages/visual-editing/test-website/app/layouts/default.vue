<script setup>
import { useAsyncData } from '#app';
import { computed, watch } from 'vue';
import { readItem, readSingleton } from '@directus/sdk';
import { apply, remove } from '@directus/visual-editing';

const {
	data: siteData,
	error: siteError,
	status,
	refresh,
} = await useAsyncData('site-data', async () => {
	const { $directus } = useNuxtApp();

	try {
		const [globals, headerNavigation, footerNavigation] = await Promise.all([
			$directus.request(
				readSingleton('globals', {
					fields: ['id', 'title', 'description', 'logo', 'logo_dark_mode', 'social_links', 'accent_color', 'favicon'],
				}),
			),
			$directus.request(
				readItem('navigation', 'main', {
					fields: [
						'id',
						'title',
						{
							items: [
								'id',
								'title',
								'url',
								{ page: ['permalink'] },
								{
									children: ['id', 'title', 'url', { page: ['permalink'] }],
								},
							],
						},
					],
					deep: {
						items: {
							_sort: ['sort'],
							children: {
								_sort: ['sort'],
							},
						},
					},
				}),
			),
			$directus.request(
				readItem('navigation', 'footer', {
					fields: [
						'id',
						'title',
						{
							items: [
								'id',
								'title',
								'url',
								{ page: ['permalink'] },
								{
									children: ['id', 'title', 'url', { page: ['permalink'] }],
								},
							],
						},
					],
					deep: {
						items: {
							_sort: ['sort'],
							children: {
								_sort: ['sort'],
							},
						},
					},
				}),
			),
		]);

		return { globals, headerNavigation, footerNavigation };
	} catch {
		throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
	}
});

const fallbackSiteData = {
	headerNavigation: { items: [] },
	footerNavigation: { items: [] },
	globals: {
		title: 'Simple CMS',
		description: 'A starter CMS template powered by Nuxt and Directus.',
		logo: '',
		social_links: [],
		accent_color: '#6644ff',
		favicon: '',
	},
};

const finalSiteData = computed(() => siteData.value || fallbackSiteData);

const headerNavigation = computed(() => finalSiteData.value?.headerNavigation || { items: [] });
const footerNavigation = computed(() => finalSiteData.value?.footerNavigation || { items: [] });
const globals = computed(() => finalSiteData.value?.globals || fallbackSiteData.globals);

const siteTitle = computed(() => globals.value?.title || 'Simple CMS');
const siteDescription = computed(() => globals.value?.description || '');
const faviconURL = computed(() => (globals.value?.favicon ? `/assets/${globals.value.favicon}` : '/favicon.ico'));

const updateAccentColor = () => {
	if (import.meta.client) {
		document.documentElement.style.setProperty('--accent-color', globals.value.accent_color);
	}
};

watch(() => globals.value.accent_color, updateAccentColor, { immediate: true });

useHead({
	titleTemplate: (pageTitle) => (pageTitle ? `${pageTitle} | ${siteTitle.value}` : siteTitle.value),
	meta: [
		{ name: 'description', content: siteDescription },
		{ property: 'og:title', content: siteTitle },
		{ property: 'og:description', content: siteDescription },
		{ property: 'og:type', content: 'website' },
	],
	link: [{ rel: 'icon', type: 'image/x-icon', href: faviconURL }],
});

provide('refreshSiteData', refresh);

(function useVisualEditingTest() {
	if (!import.meta.client) return;

	const {
		public: { visualEditingTestEnv, testCase, directusUrl },
	} = useRuntimeConfig();

	if (!visualEditingTestEnv) return;

	if (testCase === 'refresh' || testCase === 'refresh-customized') {
		useRuntimeHook('page:start', remove);
	}

	if (testCase === 'refresh-all') {
		useRuntimeHook('page:start', remove);
		useRuntimeHook('page:finish', () => apply({ directusUrl, onSaved: () => refreshNuxtData() }));
	}

	if (testCase === 'basic' || testCase === 'methods') {
		useRuntimeHook('page:start', remove);
		useRuntimeHook('page:finish', () => apply({ directusUrl }));
	}
})();
</script>

<template>
	<div>
		<div v-if="siteError">
			<p>Failed to load site data. Please try again later.</p>
		</div>

		<div v-else-if="status === 'pending'">
			<p>Loading...</p>
		</div>

		<NavigationBar
			v-if="!siteError && status !== 'pending' && headerNavigation"
			:navigation="headerNavigation"
			:globals="globals"
		/>
		<NuxtPage />
		<Footer
			v-if="!siteError && status !== 'pending' && footerNavigation"
			:navigation="footerNavigation"
			:globals="globals"
		/>
	</div>
</template>

<style>
:root {
	--directus-visual-editing--overlay--z-index: 40;
}

/* Dark mode styles */
.dark {
	--directus-visual-editing--rect--border-color: white;
	--directus-visual-editing--edit-btn--bg-color: white;
	--directus-visual-editing--edit-btn--icon-bg-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="%236644ff"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/></svg>');
}
</style>
