<script setup>
import getImageUrl from '@thumbsmith/url';
import { useHead } from '@unhead/vue';
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed, unref } from 'vue';

const { Layout } = DefaultTheme;
const { page, frontmatter, theme } = useData();

const meta = computed(() => {
	const title = unref(frontmatter).title || unref(page).title;
	const description = unref(frontmatter).description || unref(page).description;

	const lastUpdated = new Date(unref(page).lastUpdated).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const readTime = unref(frontmatter).readTime || '';

	let path = '/';

	const walkTree = (pages, crumbs) => {
		for (const page of pages) {
			if (page.text === unref(page).title) {
				path = page.link;
				return crumbs;
			}

			if (Array.isArray(page.items)) {
				const itemCrumbs = walkTree(page.items, [...crumbs, page.text]);
				if (Array.isArray(itemCrumbs)) {
					return itemCrumbs;
				}
			}
		}

		return null;
	};

	const breadcrumb = walkTree(unref(theme).sidebar, []);

	const imageUrl = getImageUrl({
		account: 'directus',
		template: 'docs',
		data: { title, lastUpdated, readTime, breadcrumb },
		type: 'png',
	});

	const pageUrl = `https://docs.directus.io${path}`;

	return [
		{ property: 'og:title', content: title },
		{ property: 'og:description', content: description },
		{ property: 'og:url', content: pageUrl },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:image', content: imageUrl },
		{ property: 'og:image:width', content: 1200 },
		{ property: 'og:image:height', content: 630 },

		{ name: 'twitter:title', content: title },
		{ name: 'twitter:description', content: description },
		{ name: 'twitter:url', content: pageUrl },
		{ name: 'twitter:site', content: '@directus' },
		{ name: 'twitter:card', content: 'summary_large_image' },
		{ name: 'twitter:image', content: imageUrl },
		{ name: 'twitter:image:width', content: 1200 },
		{ name: 'twitter:image:height', content: 630 },
	];
});

useHead({ meta });
</script>

<template><Layout /></template>
